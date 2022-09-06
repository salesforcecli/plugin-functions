/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { join, basename } from 'path';
import { SfProject, StateAggregator } from '@salesforce/core';
import herokuColor from '@heroku-cli/color';
import { UpsertResult } from 'jsforce';
import { Deployer, Deployable, SfHook } from '@salesforce/sf-plugins-core';
import { cyan } from 'chalk';
import debugFactory from 'debug';
import APIClient, { herokuClientApiUrl } from '../lib/api-client';
import Git from '../lib/git';
import { Build, ComputeEnvironment, Formation, FunctionReference, Release } from '../lib/sfdc-types';
import { fetchAppForProject, fetchOrg, fetchSfdxProject } from '../lib/utils';
import {
  ensureArray,
  filterProjectReferencesToRemove,
  FullNameReference,
  resolveFunctionReferences,
  splitFullName,
} from '../lib/function-reference-utils';
import batchCall from '../lib/batch-call';
import herokuVariant from '../lib/heroku-variant';

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
  packageVersionCreate?: boolean; // True if caller is creating a package version
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
  protected stateAggregator!: StateAggregator;
  protected TOKEN_BEARER_KEY = 'functions-bearer';
  private auth?: string;
  private client?: APIClient;
  private git?: Git;

  public static NAME = 'Functions';

  private username!: string;
  private branch!: string;
  private force!: boolean;
  private quiet!: boolean;
  private packageVersionCreate!: boolean;

  public constructor(private functionsDir: string) {
    super();
    this.deployables = [new FunctionsDeployable(functionsDir, this)];
  }

  public getName(): string {
    return FunctionsDeployer.NAME;
  }

  public async setup(flags: Deployer.Flags, options: FunctionsDeployOptions): Promise<Deployer.Options> {
    this.stateAggregator = await StateAggregator.getInstance();
    const apiKey = process.env.SALESFORCE_FUNCTIONS_API_KEY;

    if (apiKey) {
      this.auth = apiKey;
    } else {
      const token = this.stateAggregator.tokens.get(this.TOKEN_BEARER_KEY, true)?.token;

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

    this.packageVersionCreate = options.packageVersionCreate || false;

    if (flags.interactive) {
      // TODO [FunctionsPackaging]: If packageVersionCreate is defined, interactive should not be supported.

      this.username = await this.promptForUsername();
      this.branch = await this.promptForBranch();
      this.force = await this.promptForForce();
      this.quiet = await this.promptForQuiet();
    } else {
      this.username = options.username || (await this.promptForUsername());
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      this.branch = options.branch || (await this.git!.getCurrentBranch());
      this.force = typeof options.force === 'boolean' ? options.force : await this.promptForForce();
      this.quiet = typeof options.quiet === 'boolean' ? options.quiet : await this.promptForQuiet();
    }

    // TODO [FunctionsPackaging]: If packageVersionCreate is defined and quiet==true and until image_ref==null is fixed,
    //   fail as we need to parse the build out for image digests.

    return {
      username: this.username,
      branch: this.branch,
      force: this.force,
      quiet: this.quiet,
      packageVersionCreate: this.packageVersionCreate,
    };
  }

  public async deploy(): Promise<void> {
    await this.deployForPackaging();
  }

  // TODO: If functionsToBuild is provided, build and publish only given function dirs
  public async deployForPackaging(functionsToBuild: string[] = []): Promise<FunctionReference[]> {
    const flags = {
      'connected-org': this.username,
      branch: this.branch,
      force: this.force,
      quiet: this.quiet,
      packageVersionCreate: this.packageVersionCreate,
    };

    if (!flags.packageVersionCreate) {
      this.log();
      this.log(`Deploying ${cyan.bold(basename(this.functionsDir))}`);
    }

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
    const functionReferences = await resolveFunctionReferences(project);

    let app: ComputeEnvironment;
    try {
      app = await fetchAppForProject(this.client!, project.name, flags['connected-org']);
    } catch (err) {
      const error = err as { body: { message?: string } };
      if (error.body.message?.includes("Couldn't find that app")) {
        throw new Error(
          `No compute environment found for org ${flags['connected-org']}. Please ensure you've created a compute environment before deploying.`
        );
      }

      throw error;
    }

    if (flags.force && app.sales_org_connection?.sales_org_stage === 'prod' && !flags.packageVersionCreate) {
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

    let buildDeployOutput: any;
    try {
      const { stderr } = await this.git!.exec(pushCommand, flags.quiet);
      buildDeployOutput = stderr.toString();
    } catch (err) {
      const error = err as Error;
      // if they've passed `--quiet` we don't want to show any build server output *unless* there's
      // an error, in which case we want to show all of it
      if (flags.quiet) {
        throw new Error(error.message.replace(this.auth || '', '<REDACTED>'));
      }

      // In this case, they have not passed `--quiet`, in which case we have already streamed
      // the entirety of the build server output and don't need to show it again
      throw new Error('There was an issue when deploying your functions.');
    }

    // Gather and set FunctionReference.ImageReference values for package version create requests
    if (flags.packageVersionCreate) {
      if (buildDeployOutput && buildDeployOutput !== 'Everything up-to-date') {
        // Okay, functions are new or change(s) were detected - a build was performed.
        // Parse the build output finding build ids - should be the same build id for each function.
        // We'll use the build id to ensure that this build was the latest build before retrieving function image digests.
        const foundBuildIds: string[] = [];
        functionReferences.forEach((fr) => {
          // Eg "b085ee56-e04b-48a2-b4d6-580ce0e9f3a8/unitofworkfunction:3b328335-c9c1-47ce-aabd-1aaaee800303"
          // where the 1st UUID is the compute env id and 2nd is the build id
          const found = [...buildDeployOutput.matchAll(new RegExp(`[a-z0-9-]*/${fr.label}:([a-z0-9-]*)`, 'gm'))];
          if (found && found.length === 1 && found[0].length === 2) {
            foundBuildIds.push(found[0][1]);
          }
        });

        // Ensure build ids are the same - should just have 1 build id for all
        const shouldHaveOneBuildIdForAll = foundBuildIds.filter(
          (value, idx, buildIds) => buildIds.indexOf(value) === idx
        );
        if (shouldHaveOneBuildIdForAll.length !== 1) {
          throw new Error(
            `There was an issue when deploying your functions - found multiple build ids. [${shouldHaveOneBuildIdForAll.join(
              ','
            )}]`
          );
        }

        // Get release id to be used to query release info below
        const buildResponse = await this.client!.get<Build>(`/apps/${app.name}/builds/${shouldHaveOneBuildIdForAll[0]}`, {
          headers: {
            Accept: 'application/vnd.heroku+json; version=3',
          },
        });
        if (buildResponse.data.status !== 'succeeded') {
          throw new Error('There was an issue when deploying your functions');
        }

        // Ensure that this build is the latest before grabbing image_refs for deployed functions
        const releaseResponse = await this.client!.get<Release>(`/apps/${app.name}/releases/${buildResponse.data.release.id}`, {
          headers: {
            Accept: 'application/vnd.heroku+json; version=3',
          },
        });
        if (!releaseResponse.data.current) {
          throw new Error('This function build is not the latest.  Please invoke command again to rebuild.');
        }
      }

      // Get image references for successfully deployed functions
      const { data } = await this.client!.get<Formation[]>(`/apps/${app.id}/formation`, {
        headers: {
          ...herokuVariant('docker-releases'),
        },
      });
      // Now set API's formation.docker_image.image_ref to FR.ImageReference
      // TODO: Currently, formation.docker_image.image_ref is missing.  See link below for bug to fix.
      // https://gus.lightning.force.com/lightning/r/ADM_Work__c/a07EE000015GsvYYAS/view
      functionReferences.forEach((fr) => {
        const formation = data.find(({ type }) => type === fr.label);
        if (formation) {
          fr.imageReference = JSON.stringify(formation);
        } else {
          throw new Error(`Function image not found for function ${fr.label}`);
        }
      });

      // Ensure that all FR.ImageReferences are set
      const missingImageReferences = functionReferences.filter((fr) => !fr.imageReference);
      if (missingImageReferences.length > 0) {
        throw new Error(
          `ImageReference is missing for functions: ${missingImageReferences.map(({ label }) => label).join(',')}`
        );
      }
    } else {
      // REVIEWME: Not deploying FRs to Org for package version create requests

      debug('pushing function references', functionReferences);

      const connection = org.getConnection();

      // Since the metadata upsert API can only handle 10 records at a time AND needs to run in sequence, we need to
      // make sure that we're only submitting 10 records at once and then waiting for that batch to complete before
      // submitting more
      const results = await batchCall<FunctionReference, UpsertResult>(functionReferences, (chunk) =>
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

    // Return all (REVIEWME: Exclude removed FunctionReferences?)
    return functionReferences;
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
  const project = await SfProject.resolve();
  const functionsPath = join(project.getPath(), 'functions');
  return [new FunctionsDeployer(functionsPath)];
};

export default hook;
