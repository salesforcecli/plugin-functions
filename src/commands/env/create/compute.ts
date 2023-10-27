/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import * as Heroku from '@heroku-cli/schema';
import { Flags } from '@oclif/core';
import { Messages } from '@salesforce/core';
import { QueryResult } from 'jsforce';
import { cli } from 'cli-ux';
import debugFactory from 'debug';
import Command from '../../../lib/base';
import { FunctionsFlagBuilder } from '../../../lib/flags';
import pollForResult from '../../../lib/poll-for-result';
import { fetchAppForProject, fetchOrg, fetchSfdxProject } from '../../../lib/utils';

interface FunctionConnectionRecord {
  Id: string;
  Status: 'TrustedUniDirection' | 'TrustedBiDirection';
  Error?: string;
}

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.create.compute');

const debug = debugFactory('env:create:compute');

export default class EnvCreateCompute extends Command {
  static summary = messages.getMessage('summary');

  static description = messages.getMessage('description');

  static examples = messages.getMessages('examples');

  static flags = {
    'connected-org': FunctionsFlagBuilder.connectedOrg(),
    alias: Flags.string({
      char: 'a',
      description: messages.getMessage('flags.alias.summary'),
    }),
  };

  async run() {
    const { flags } = await this.parse(EnvCreateCompute);
    this.postParseHook(flags);

    const alias = flags.alias;

    // if `--connected-org` is null here, fetchOrg will pull the default org from the surrounding environment
    const org = await fetchOrg(flags['connected-org']);

    const orgId = org.getOrgId();

    if (!(await this.isFunctionsEnabled(org))) {
      this.error(
        `The org you are attempting to create a compute environment for does not have the ${herokuColor.green(
          'Functions'
        )} feature enabled.\n` +
          '\n' +
          'Before you can create a compute environment, please:\n' +
          '1. Enable Functions in your DevHub org\n' +
          `2. Add ${herokuColor.green(
            'Functions'
          )} to the "features" list in your scratch org definition JSON file, e.g. "features": ["Functions"]`
      );
    }
    cli.action.start(`Creating compute environment for org ID ${orgId}`);
    const project = await fetchSfdxProject();
    const projectName = project.name;

    if (!projectName) {
      this.error('No project name found in sfdx-project.json.');
    }

    const connection = org.getConnection();
    await pollForResult(async () => {
      // This query allows us to verify that the org connection has actually been created before
      // attempting to create a compute environment. If we don't wait for this to happen, environment
      // creation will fail since Heroku doesn't yet know about the org
      const queryStart = new Date().getTime();
      const response: QueryResult<FunctionConnectionRecord> = await connection.query<FunctionConnectionRecord>(`SELECT
          Id,
          Status,
          Error
          FROM FunctionConnection`);

      // If it's a newly created org, we likely won't get anything back for the first few iterations,
      // we keep polling
      const queryMillis = new Date().getTime() - queryStart;
      debug(`query FunctionConnection records=${response.records.length} millis=${queryMillis}`);
      if (!response.records.length) {
        return false;
      }

      const record: FunctionConnectionRecord = response.records[0];
      debug(`record FunctionConnection id=${record.Id} status=${record.Status} error=${record.Error}`);

      // This error is also expected when working with a newly created org. This error just means
      // that the devhub hasn't yet enabled functions on the new org (this is an automated async process
      // so it takes a bit of time)
      if (record.Error === 'Enable Salesforce Functions from Setup Page') {
        debug(`got FunctionConnection.Error=${record.Error}, devhub Functions setup incomplete`);
        return false;
      }

      // If there is any other error besides the one mentioned above, something is actually wrong
      // and we should bail
      if (record.Error) {
        debug(`FunctionConnection Error exists (${record.Error}. Waiting.)`);
        this.error(`${record.Error}`);
      }

      // This is the go signal. Once we have this status it means that the connection is fully up
      // and running, and we are good to create a compute environment.
      const readyMsg = record.Status === 'TrustedBiDirection' ? 'is ready, proceeding.' : 'NOT ready, waiting.';
      debug(`FunctionConnection Status=${record.Status} ${readyMsg}`);
      return record.Status === 'TrustedBiDirection';
    });

    try {
      const postStart = new Date().getTime();
      debug(`begin POST /sales-org-connections/${orgId}/apps sfdx_project_name=${projectName} ...`);
      const { data: app } = await this.client.post<Heroku.App>(`/sales-org-connections/${orgId}/apps`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.evergreen',
        },
        data: {
          sfdx_project_name: projectName,
        },
      });

      cli.action.stop();
      const postMillis = new Date().getTime() - postStart;
      debug(`end POST millis=${postMillis} app=${JSON.stringify(app)}`);

      this.log(`New compute environment created with ID ${app.name}`);

      cli.action.start('Connecting environments');

      if (alias) {
        this.stateAggregator.aliases.set(alias, app.id!);
        await this.stateAggregator.aliases.write();
      }

      cli.action.stop();
      this.log(
        alias
          ? `Your compute environment with local alias ${herokuColor.cyan(alias)} is ready.`
          : 'Your compute environment is ready.'
      );
    } catch (err) {
      const DUPLICATE_PROJECT_MESSAGE =
        'There is already a project with the same name in the same namespace for this org';
      const INVALID_PROJECT_NAME =
        "Sfdx project name may only contain numbers (0-9), letters (a-z A-Z) and non-consecutive underscores ('_'). It must begin with a letter and end with either a number or letter.";
      const error = err as { data: { message?: string } };
      cli.action.stop('error!');

      if (error.data?.message?.includes(INVALID_PROJECT_NAME)) {
        this.error(
          "Project name may only contain numbers (0-9), letters (a-z A-Z) and non-consecutive underscores ('_'). It must begin with a letter and end with either a number or letter"
        );
      }
      // If environment creation fails because an environment already exists for this org and project
      // we want to fetch the existing environment so that we can point the user to it
      if (error.data?.message?.includes(DUPLICATE_PROJECT_MESSAGE)) {
        const app = await fetchAppForProject(this.client, projectName, org.getUsername());
        this.error(`This org is already connected to a compute environment for this project -> ${app.name}`);
      }
      this.error(`${error.data.message}`);
    }
    const fetchStart = new Date().getTime();
    debug(`begin GET /sales-org-connections/${orgId}/apps/${projectName} ...`);
    const app = await fetchAppForProject(this.client, projectName, org.getUsername());
    const fetchMillis = new Date().getTime() - fetchStart;
    debug(`end GET millis=${fetchMillis} app=${JSON.stringify(app)}`);
    return {
      alias,
      projectName,
      connectedOrgAlias: '',
      connectedOrgId: orgId,
      computeEnvironmentName: app.name,
    };
  }
}
