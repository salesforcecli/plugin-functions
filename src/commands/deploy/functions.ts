/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { URL } from 'url';
import herokuColor from '@heroku-cli/color';
import { Messages } from '@salesforce/core';
import { Flags } from '@oclif/core';
import { cli } from 'cli-ux';
import debugFactory from 'debug';
import { UpsertResult } from 'jsforce';
import Command from '../../lib/base';
import batchCall from '../../lib/batch-call';
import { FunctionsFlagBuilder } from '../../lib/flags';
import {
  ensureArray,
  filterProjectReferencesToRemove,
  FullNameReference,
  splitFullName,
} from '../../lib/function-reference-utils';
import Git from '../../lib/git';
import { resolveFunctionsPaths } from '../../lib/path-utils';
import { parseProjectToml } from '../../lib/project-toml';
import { ComputeEnvironment, FunctionReference, SfdxProjectConfig } from '../../lib/sfdc-types';

const debug = debugFactory('deploy:functions');

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'project.deploy.functions');

export default class DeployFunctions extends Command {
  private git?: Git;

  static flags = {
    'connected-org': FunctionsFlagBuilder.connectedOrg({
      required: true,
    }),
    branch: Flags.string({
      char: 'b',
      description: messages.getMessage('flags.branch.summary'),
    }),
    force: Flags.boolean({
      description: messages.getMessage('flags.force.summary'),
    }),
    quiet: Flags.boolean({
      description: messages.getMessage('flags.quiet.summary'),
      char: 'q',
    }),
  };

  static aliases = ['project:deploy:functions'];

  async getCurrentBranch() {
    const statusString = await this.git?.status();

    return statusString!.split('\n')[0].replace('On branch ', '');
  }

  async gitRemote(app: ComputeEnvironment) {
    const externalApiKey = process.env.SALESFORCE_FUNCTIONS_API_KEY;
    const url = new URL(app.git_url!);

    if (externalApiKey) {
      url.password = externalApiKey;
      url.username = '';

      return url.toString();
    }

    const username = this.username;
    const token = this.auth;

    if (!username || !token) {
      this.error('No login found. Please log in using the `login:functions` command.');
    }

    url.username = username;
    url.password = token;

    return url.toString();
  }

  async resolveFunctionReferences(project: SfdxProjectConfig) {
    // Locate functions directory and grab paths for all function names, error if not in project or no
    // functions found
    const fnPaths = await resolveFunctionsPaths();

    // Create function reference objects
    return Promise.all(
      fnPaths.map(async (fnPath) => {
        const projectTomlPath = path.join(fnPath, 'project.toml');
        const projectToml: any = await parseProjectToml(projectTomlPath);
        const fnName = projectToml.com.salesforce.id;

        const fnReference: FunctionReference = {
          fullName: `${project.name}-${fnName}`,
          label: fnName,
          description: projectToml.com.salesforce.description,
        };

        const permissionSet = projectToml._.metadata?.permissionSet;

        if (permissionSet) {
          fnReference.permissionSet = permissionSet;
        }

        return fnReference;
      })
    );
  }

  async run() {
    const { flags } = await this.parse(DeployFunctions);

    // We pass the api token value to the Git constructor so that it will redact it from any of
    // the server logs
    const redactedToken = this.auth;
    this.git = new Git([redactedToken ?? '']);

    // We don't want to deploy anything if they've got work that hasn't been committed yet because
    // it could end up being really confusing since the user isn't calling git directly
    if (await this.git.hasUnpushedFiles()) {
      this.error(
        'Your repo has files that have not been committed yet. Please either commit or stash them before deploying your project.'
      );
    }

    // Heroku side: Fetch git remote URL and push working branch to Heroku git server
    cli.action.start('Pushing changes to functions');
    const org = await this.fetchOrg(flags['connected-org']);
    const project = await this.fetchSfdxProject();

    // FunctionReferences: create function reference using info from function.toml and project info
    // we do this early on because we don't want to bother with anything else if it turns out
    // there are no functions to deploy
    const references = await this.resolveFunctionReferences(project);

    let app: ComputeEnvironment;
    try {
      app = await this.fetchAppForProject(project.name, flags['connected-org']);
    } catch (error) {
      if (error.body.message?.includes("Couldn't find that app")) {
        this.error(
          `No compute environment found for org ${flags['connected-org']}. Please ensure you've created a compute environment before deploying.`
        );
      }

      throw error;
    }

    if (flags.force && app.sales_org_connection?.sales_org_stage === 'prod') {
      this.error('You cannot use the `--force` flag with a production org.');
    }

    const remote = await this.gitRemote(app);

    debug('pushing to git server');

    const currentBranch = await this.getCurrentBranch();

    const pushCommand = ['push', remote, `${flags.branch ?? currentBranch}:master`];

    // Since we error out if they try to use `--force` with a production org, we don't check for
    // a production org here since this code would be unreachable in that scenario
    if (flags.force) {
      pushCommand.push('--force');
    }

    try {
      await this.git.exec(pushCommand, flags.quiet);
    } catch (error) {
      // if they've passed `--quiet` we don't want to show any build server output *unless* there's
      // an error, in which case we want to show all of it
      if (flags.quiet) {
        this.error(error.message.replace(redactedToken, '<REDACTED>'));
      }

      // In this case, they have not passed `--quiet`, in which case we have already streamed
      // the entirety of the build server output and don't need to show it again
      this.error('There was an issue when deploying your functions.');
    }

    debug('pushing function references', references);

    const connection = org.getConnection();

    let shouldExitNonZero = false;

    // Since the metadata upsert API can only handle 10 records at a time AND needs to run in sequence, we need to
    // make sure that we're only submitting 10 records at once and then waiting for that batch to complete before
    // submitting more
    const results = await batchCall<FunctionReference, UpsertResult>(references, (chunk) =>
      connection.metadata.upsert('FunctionReference', chunk)
    );

    results.forEach((result) => {
      if (!result.success) {
        shouldExitNonZero = true;
        cli.error(`Unable to deploy FunctionReference for ${result.fullName}.`, { exit: false });
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

    cli.action.stop();

    if (shouldExitNonZero) {
      cli.exit(1);
    }
  }
}
