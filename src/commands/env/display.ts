/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Flags } from '@oclif/core';
import { AuthInfo, Org, sfdc, Messages } from '@salesforce/core';
import { cli } from 'cli-ux';
import { OrgListUtil } from '@salesforce/plugin-org/lib/shared/orgListUtil';
import { getAliasByUsername } from '@salesforce/plugin-org/lib/shared/utils';
import { getStyledValue } from '@salesforce/plugin-org/lib/shared/orgHighlighter';
import Command from '../../lib/base';
import { ComputeEnvironment, Dictionary } from '../../lib/sfdc-types';
import { FunctionsFlagBuilder } from '../../lib/flags';
import herokuVariant from '../../lib/heroku-variant';
import { ensureArray } from '../../lib/function-reference-utils';
import { fetchSfdxProject } from '../../lib/utils';

interface EnvDisplayTable {
  alias?: string;
  environmentName: string;
  project: string;
  createdDate?: string;
  functions?: string[];
  connectedOrgs?: string;
  appId?: string;
  spaceId?: string;
}

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.display');

export default class EnvDisplay extends Command {
  static description = messages.getMessage('summary');
  static examples = messages.getMessages('examples');
  static disableJsonFlag = false;

  static flags = {
    'target-compute': FunctionsFlagBuilder.environment({
      required: true,
    }),
    extended: Flags.boolean({
      char: 'x',
      hidden: true,
    }),
  };

  async run() {
    const { flags } = await this.parse(EnvDisplay);

    try {
      // If we are able to successfully create an org, then we verify that this name does not refer
      // to a compute environment. Regardless of what happens, this block will result in an error.
      const org: Org = await Org.create({ aliasOrUsername: flags['target-compute'] });
      const authInfo = await AuthInfo.create({ username: org.getUsername() });
      const fields = authInfo.getFields(true);

      const isScratchOrg = fields.devHubUsername;
      const scratchOrgInfo = isScratchOrg && fields.orgId ? await this.getScratchOrgInformation(fields.orgId, org) : {};

      const sfdxAuthUrl = fields.refreshToken ? authInfo.getSfdxAuthUrl() : undefined;
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
    const appName = await this.resolveAppNameForEnvironment(flags['target-compute']);

    try {
      // If app exists, environment details will be displayed
      const { data: app } = await this.client.get<ComputeEnvironment>(`/apps/${appName}`, {
        headers: {
          ...herokuVariant('evergreen'),
        },
      });
      const salesOrgId = app.sales_org_connection?.sales_org_id;
      const org = await this.resolveOrg(salesOrgId);
      const project = await fetchSfdxProject();
      const connection = org.getConnection();

      const refList = await connection.metadata.list({ type: 'FunctionReference' });
      const fnNames = ensureArray(refList).map((ref) => ref.fullName.split('-')[1]);

      const alias = appName === flags['target-compute'] ? undefined : flags['target-compute'];

      const returnValue: EnvDisplayTable = {
        // renamed properties
        alias,
        environmentName: app.name!,
        project: project.name,
        createdDate: app.created_at,
        functions: fnNames.length ? fnNames : undefined,
        connectedOrgs: salesOrgId,
      };

      if (flags.extended) {
        returnValue.appId = app.id;
        returnValue.spaceId = app.space?.id;
      }
      return this.print(returnValue, flags.json);
    } catch (error) {
      if (error.body?.message.includes("Couldn't find that app.")) {
        // App with name does not exist
        this.error('Value provided for environment does not match any environment names or aliases.');
      } else {
        this.error(error);
      }
    }
  }

  private print(result: any, json = false): void {
    const tableRowKeys = Object.keys(result)
      // some values won't exist, and we want to ensure functions is at the end
      .filter((key) => result[key] !== undefined && result[key] !== null && key !== 'functions')
      .sort();

    // If the environment has functions, we want to display them but make sure they're listed at the end
    if (result.functions?.length) {
      tableRowKeys.push('functions');
    }

    if (json) {
      const jsonOutput = tableRowKeys.reduce((acc: Dictionary<string>, elem) => {
        acc[elem] = result[elem];
        return acc;
      }, {});

      cli.styledJSON(jsonOutput);
      return;
    }

    const tableRows = tableRowKeys.map((key) => {
      let value = result[key];
      if (key === 'functions') {
        value = value.join('\n');
      }

      return {
        key: this.camelCaseToTitleCase(key),
        value: getStyledValue(key, value),
      };
    });

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
        printLine: this.log.bind(this),
        ...Flags,
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
