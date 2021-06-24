/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags } from '@oclif/command';
import { AuthInfo, Org, sfdc } from '@salesforce/core';
import { cli } from 'cli-ux';
import { OrgListUtil } from '@salesforce/plugin-org/lib/shared/orgListUtil';
import { getAliasByUsername } from '@salesforce/plugin-org/lib/shared/utils';
import { getStyledValue } from '@salesforce/plugin-org/lib/shared/orgHighlighter';
import { sortBy } from 'lodash';
import Command from '../../lib/base';
import { ComputeEnvironment } from '../../lib/sfdc-types';
import { FunctionsFlagBuilder } from '../../lib/flags';
import herokuVariant from '../../lib/heroku-variant';
import { ensureArray } from '../../lib/function-reference-utils';

export default class EnvDelete extends Command {
  static description = 'display details for an environment';

  static examples = ['$ sfdx env:display --environment=billingApp-Scratch1'];

  static flags = {
    environment: FunctionsFlagBuilder.environment({
      required: true,
    }),
    verbose: flags.boolean({
      description: 'verbose display output',
    }),
  };

  async resolveScratchOrg(scratchOrgId: string) {
    // adapted from https://github.com/salesforcecli/plugin-org/blob/3012cc04a670e4bf71e75a02e2f0981a71eb4e0d/src/commands/force/org/list.ts#L44-L90
    let fileNames: string[] = [];
    try {
      fileNames = await AuthInfo.listAllAuthFiles();
    } catch (error) {
      if (error.name === 'NoAuthInfoFound') {
        this.error('No orgs found');
      } else {
        throw error;
      }
    }

    const metaConfigs = await OrgListUtil.readLocallyValidatedMetaConfigsGroupedByOrgType(fileNames, {});

    const scratchOrgs = sortBy(metaConfigs.scratchOrgs, (v) => [v.alias, v.username]);
    return scratchOrgs.find((org) => org.orgId === scratchOrgId);
  }

  async run() {
    const { flags } = this.parse(EnvDelete);

    const { environment } = flags;

    try {
      // If we are able to successfully create an org, then we verify that this name does not refer
      // to a compute environment. Regardless of what happens, this block will result in an error.
      const org: Org = await Org.create({ aliasOrUsername: environment });
      const authInfo = await AuthInfo.create({ username: org.getUsername() });
      const fields = authInfo.getFields(true);

      const isScratchOrg = fields.devHubUsername;
      const scratchOrgInfo = isScratchOrg && fields.orgId ? await this.getScratchOrgInformation(fields.orgId, org) : {};

      const sfdxAuthUrl = flags.verbose && fields.refreshToken ? authInfo.getSfdxAuthUrl() : undefined;
      const alias = fields.username ? await getAliasByUsername(fields.username) : undefined;

      const returnValue = {
        // renamed properties
        id: fields.orgId,
        devHubId: fields.devHubUsername,

        // copied properties
        accessToken: fields.accessToken,
        instanceUrl: fields.instanceUrl,
        username: fields.username,
        clientId: fields.clientId,
        password: fields.password,
        ...scratchOrgInfo,

        // properties with more complex logic
        sfdxAuthUrl,
        alias,
      };
      return this.print(returnValue);
    } catch (error) {
      // When the user provided a non Salesforce org environment (AuthInfo error), in this
      // situation we want to move on to check for a compute environment
      if (!error.message.includes('No AuthInfo found')) {
        this.error(error);
      }
    }

    // Check if the environment provided is an alias or not, to determine what app name we use to attempt deletion
    const appName = await this.resolveAppNameForEnvironment(environment);

    try {
      // If app exists, environment details will be displayed
      const app = await this.client.get<ComputeEnvironment>(`/apps/${appName}`, {
        headers: {
          ...herokuVariant('evergreen'),
        },
      });
      const salesOrgId = app.data.sales_org_connection?.sales_org_id;
      const connectedOrg = salesOrgId ? await this.resolveScratchOrg(salesOrgId) : undefined;
      const connectedOrgAlias = connectedOrg?.alias;
      const project = await this.fetchSfdxProject();
      const org = await this.fetchOrg(connectedOrgAlias);
      const connection = org.getConnection();

      const refList = await connection.metadata.list({ type: 'FunctionReference' });
      const fnNames = ensureArray(refList).map((ref) => ref.fullName.split('-')[1]);

      const alias = appName === environment ? undefined : environment;

      const returnValue = {
        // renamed properties
        alias,
        environmentName: appName,
        project: project.name,
        createdDate: app.data.created_at,
        functions: fnNames?.join('\n'),
        connectedOrgs: salesOrgId,
      };
      return this.print(returnValue);
    } catch (error) {
      if (error.body?.message.includes("Couldn't find that app.")) {
        // App with name does not exist
        this.error('Value provided for environment does not match any environment names or aliases.');
      } else {
        this.error(error);
      }
    }
  }

  private print(result: any): void {
    const tableRows = Object.keys(result)
      .filter((key) => result[key] !== undefined && result[key] !== null) // some values won't exist
      .sort() // this command always alphabetizes the table rows
      .map((key) => ({
        key: this.camelCaseToTitleCase(key),
        value: getStyledValue(key, result[key]),
      }));

    cli.table<any>(
      tableRows,
      {
        key: {
          header: 'KEY',
          get: (row) => row.key,
        },
        value: {
          header: 'VALUE',
          get: (row) => row.value,
        },
      },
      {
        printLine: this.log,
        ...flags,
      }
    );
  }

  private async getScratchOrgInformation(orgId: string, org: Org) {
    const hubOrg = await org.getDevHubOrg();
    const username = hubOrg?.getUsername();
    const salesforceID = sfdc.trimTo15(orgId);
    if (!username || !salesforceID) {
      return {};
    }
    const result = (await OrgListUtil.retrieveScratchOrgInfoFromDevHub(username, [salesforceID]))[0];
    return {
      status: result.Status,
      expirationDate: result.ExpirationDate,
      createdBy: result.CreatedBy?.Username,
      // edition: null for snapshot orgs, possibly others. Marking it undefined keeps it out of json output
      edition: result.Edition ?? undefined,
      namespace: result.Namespace ?? undefined, // may be null on server
      orgName: result.OrgName,
      createdDate: result.CreatedDate,
    };
  }

  private camelCaseToTitleCase = (text: string): string => {
    return text
      .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
      .replace(/([A-Z][a-z]+)/g, ' $1')
      .trim();
  };
}
