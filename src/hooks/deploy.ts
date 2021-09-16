/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { join, basename } from 'path';
import { SfdxProject, GlobalInfo } from '@salesforce/core';
import herokuColor from '@heroku-cli/color';
import { UpsertResult } from 'jsforce';
import { Deployer, Deployable, SfHook } from '@salesforce/sf-plugins-core';
import { cyan } from 'chalk';
import debugFactory from 'debug';
import APIClient, { herokuClientApiUrl } from '../lib/api-client';
import Git from '../lib/git';
import { ComputeEnvironment, FunctionReference } from '../lib/sfdc-types';
import { fetchAppForProject, fetchOrg, fetchSfdxProject } from '../lib/utils';
import {
  ensureArray,
  filterProjectReferencesToRemove,
  FullNameReference,
  resolveFunctionReferences,
  splitFullName,
} from '../lib/function-reference-utils';
import batchCall from '../lib/batch-call';

const debug = debugFactory('deploy');

export type FunctionsDir = {
  name: string;
  fullPath: string;
};

export interface FunctionsDeployOptions {
  username?: string;
  branch?: string;
  force?: boolean;
  quiet?: boolean;
}

export class FunctionsDeployable extends Deployable {
  public constructor(public functionsDir: string, private parent: Deployer) {
    super();
  }

  public getName(): string {
    return basename(this.functionsDir);
  }

  public getType(): string {
    return 'function';
  }

  public getPath(): string {
    return basename(this.functionsDir);
  }

  public getParent(): Deployer {
    return this.parent;
  }
}
export class FunctionsDeployer extends Deployer {
  protected info!: GlobalInfo;
  protected TOKEN_BEARER_KEY = 'functions-bearer';
  private auth?: string;
  private client?: APIClient;
  private git?: Git;

  public static NAME = 'Functions';

  private username!: string;
  private branch!: string;
  private force!: boolean;
  private quiet!: boolean;

  public constructor(private functionsDir: string) {
    super();
    this.deployables = [new FunctionsDeployable(functionsDir, this)];
  }

  public getName(): string {
    return FunctionsDeployer.NAME;
  }

  public async setup(flags: Deployer.Flags, options: FunctionsDeployOptions): Promise<Deployer.Options> {
    this.info = await GlobalInfo.getInstance();
    const apiKey = process.env.SALESFORCE_FUNCTIONS_API_KEY;

    if (apiKey) {
      this.auth = apiKey;
    } else {
      const token = this.info.getToken(this.TOKEN_BEARER_KEY, true)?.token;

      if (!token) {
        throw new Error('Not authenticated. Please login with `sf login functions`.');
      }
      this.auth = token;
    }

    this.client = new APIClient({
      auth: this.auth,
      apiUrl: herokuClientApiUrl(),
    });

    // We pass the api token value to the Git constructor so that it will redact it from any of
    // the server logs
    const redactedToken = this.auth;
    this.git = new Git([redactedToken ?? '']);

    if (flags.interactive) {
      this.username = await this.promptForUsername();
      this.branch = await this.promptForBranch();
      this.force = await this.promptForForce();
      this.quiet = await this.promptForQuiet();
    } else {
      this.username = options.username || (await this.promptForUsername());
      this.branch = options.branch || (await this.promptForBranch());
      this.force = typeof options.force === 'boolean' ? options.force : await this.promptForForce();
      this.quiet = typeof options.quiet === 'boolean' ? options.quiet : await this.promptForQuiet();
    }

    return {
      username: this.username,
      branch: this.branch,
      force: this.force,
      quiet: this.quiet,
    };
  }

  public async deploy(): Promise<void> {
    this.log();
    this.log(`Deploying ${cyan.bold(basename(this.functionsDir))}`);

    const flags = {
      'connected-org': this.username,
      branch: this.branch,
      force: this.force,
      quiet: this.quiet,
    };

    // We don't want to deploy anything if they've got work that hasn't been committed yet because
    // it could end up being really confusing since the user isn't calling git directly
    if (await this.git!.hasUnpushedFiles()) {
      throw new Error(
        'Your repo has files that have not been committed yet. Please either commit or stash them before deploying your project.'
      );
    }

    // Heroku side: Fetch git remote URL and push working branch to Heroku git server
    console.log('Pushing changes to functions');
    const org = await fetchOrg(flags['connected-org']);
    const project = await fetchSfdxProject();

    // FunctionReferences: create function reference using info from function.toml and project info
    // we do this early on because we don't want to bother with anything else if it turns out
    // there are no functions to deploy
    const references = await resolveFunctionReferences(project);

    let app: ComputeEnvironment;
    try {
      app = await fetchAppForProject(this.client!, project.name, flags['connected-org']);
    } catch (error) {
      if (error.body.message?.includes("Couldn't find that app")) {
        throw new Error(
          `No compute environment found for org ${flags['connected-org']}. Please ensure you've created a compute environment before deploying.`
        );
      }

      throw error;
    }

    if (flags.force && app.sales_org_connection?.sales_org_stage === 'prod') {
      throw new Error('You cannot use the force option with a production org.');
    }

    const remote = await this.git!.getRemote(app, this.auth, this.username);

    debug('pushing to git server');

    const pushCommand = ['push', remote, `${flags.branch}:master`];

    // Since we error out if they try to use `--force` with a production org, we don't check for
    // a production org here since this code would be unreachable in that scenario
    if (flags.force) {
      pushCommand.push('--force');
    }

    try {
      await this.git!.exec(pushCommand, flags.quiet);
    } catch (error) {
      // if they've passed `--quiet` we don't want to show any build server output *unless* there's
      // an error, in which case we want to show all of it
      if (flags.quiet) {
        throw new Error(error.message.replace(this.auth, '<REDACTED>'));
      }

      // In this case, they have not passed `--quiet`, in which case we have already streamed
      // the entirety of the build server output and don't need to show it again
      throw new Error('There was an issue when deploying your functions.');
    }

    debug('pushing function references', references);

    const connection = org.getConnection();

    // Since the metadata upsert API can only handle 10 records at a time AND needs to run in sequence, we need to
    // make sure that we're only submitting 10 records at once and then waiting for that batch to complete before
    // submitting more
    const results = await batchCall<FunctionReference, UpsertResult>(references, (chunk) =>
      connection.metadata.upsert('FunctionReference', chunk)
    );

    results.forEach((result) => {
      if (!result.success) {
        throw new Error(`Unable to deploy FunctionReference for ${result.fullName}.`);
      }

      if (!flags.quiet) {
        this.log(
          `Reference for ${result.fullName} ${
            result.created ? herokuColor.cyan('created') : herokuColor.green('updated')
          }`
        );
      }
    });

    // Remove any function references for functions that no longer exist
    const successfulReferences = results.reduce((acc: FullNameReference[], result) => {
      if (result.success) {
        acc.push(splitFullName(result.fullName));
      }

      return acc;
    }, []);
    let refList = await connection.metadata.list({ type: 'FunctionReference' });
    refList = ensureArray(refList);

    const allReferences = refList.reduce((acc: FullNameReference[], ref) => {
      acc.push(splitFullName(ref.fullName));

      return acc;
    }, []);

    const referencesToRemove = filterProjectReferencesToRemove(allReferences, successfulReferences, project.name);

    if (referencesToRemove.length) {
      this.log('Removing the following functions that were deleted locally:');
      referencesToRemove.forEach((ref) => {
        this.log(ref);
      });
      await batchCall(referencesToRemove, (chunk) => connection.metadata.delete('FunctionReference', chunk));
    }
  }

  public async promptForUsername(): Promise<string> {
    const { username } = await this.prompt<{ username: string }>([
      {
        name: 'username',
        message: 'Select the username or alias for the org that the compute environment should be connected to:',
        type: 'input',
      },
    ]);
    return username;
  }

  public async promptForBranch(): Promise<string> {
    const { prompt } = await this.prompt<{ prompt: boolean }>([
      {
        name: 'prompt',
        message: 'Would you like to deploy to a branch other than the currently active branch?',
        type: 'confirm',
      },
    ]);
    if (prompt) {
      const { branch } = await this.prompt<{ branch: string }>([
        {
          name: 'branch',
          message: 'Are you sure you want to force push? Please use caution when force pushing.',
          type: 'input',
        },
      ]);

      return branch;
    } else {
      return await this.git!.getCurrentBranch();
    }
  }

  public async promptForForce(): Promise<boolean> {
    const { force } = await this.prompt<{ force: boolean }>([
      {
        name: 'force',
        message: 'Would you like to force push these changes to git?',
        type: 'confirm',
      },
    ]);
    if (force) {
      const { confirm } = await this.prompt<{ confirm: boolean }>([
        {
          name: 'confirm',
          message: 'Are you sure you want to force push? Please use caution when force pushing.',
          type: 'confirm',
        },
      ]);

      return confirm;
    } else {
      return false;
    }
  }

  public async promptForQuiet(): Promise<boolean> {
    const { quiet } = await this.prompt<{ quiet: boolean }>([
      {
        name: 'quiet',
        message: 'Would you like to limit the amount of output displayed from the deploy process?',
        type: 'confirm',
      },
    ]);
    return quiet;
  }
}

const hook: SfHook.Deploy<FunctionsDeployer> = async function (options) {
  const project = await SfdxProject.resolve();
  const functionsPath = join(project.getPath(), 'functions');
  return [new FunctionsDeployer(functionsPath)];
};

export default hook;
