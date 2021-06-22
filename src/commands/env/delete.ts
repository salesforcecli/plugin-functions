/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import * as Heroku from '@heroku-cli/schema';
import { AuthInfo, Org } from '@salesforce/core';
import { cli } from 'cli-ux';
import { sortBy } from 'lodash';
import { OrgListUtil } from '@salesforce/plugin-org/lib/shared/orgListUtil';
import {
  filterProjectReferencesToRemove,
  splitFullName,
  FullNameReference,
  ensureArray,
} from '../../lib/function-reference-utils';
import { FunctionsFlagBuilder, confirmationFlag } from '../../lib/flags';
import Command from '../../lib/base';

export default class EnvDelete extends Command {
  static description = 'delete an environment';

  static examples = [
    '$ sfdx env:delete --environment=billingApp-Scratch1',
    '$ sfdx env:delete --environment=billingApp-Scratch1 --confirm=billingApp-Scratch1',
  ];

  static flags = {
    environment: FunctionsFlagBuilder.environment({
      required: true,
    }),
    confirm: confirmationFlag,
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
    const { flags } = await this.parse(EnvDelete);

    const { environment } = flags;

    await this.confirmRemovePrompt('environment', environment, flags.confirm);

    cli.action.start(`Deleting environment ${environment}`);

    if (environment) {
      try {
        // If we are able to successfully create an org, then we verify that this name does not refer to a compute environment. Regardless of what happens, this block will result in an error.
        const org: Org = await Org.create({ aliasOrUsername: environment });
        if (org) {
          throw new Error(
            `The environment ${herokuColor.cyan(
              environment
            )} is a Salesforce org. The env:delete command currently can only be used to delete compute environments. Please use sfdx force:org:delete to delete scratch and sandbox Salesforce org environments.`
          );
        }
      } catch (error) {
        // If the error is the one we throw above, then we will send the error to the user. If not (meaning the org creation failed) then we swallow the error and proceed.
        if (error.message.includes(`The environment ${herokuColor.cyan(environment)} is a Salesforce org.`)) {
          this.error(error);
        }
      }
    }

    // Check if the environment provided is an alias or not, to determine what app name we use to attempt deletion
    const appName = await this.resolveAppNameForEnvironment(environment);

    try {
      // If app exists, it will be deleted
      const app = await this.client.get<Heroku.App>(`/apps/${appName}`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.evergreen',
        },
      });

      // Find and delete all connected function references if they exist
      const connectedOrg = await this.resolveScratchOrg(app.data.sales_org_connection?.sales_org_id);
      const connectedOrgAlias = connectedOrg?.alias;
      const project = await this.fetchSfdxProject();
      const org = await this.fetchOrg(connectedOrgAlias);
      const connection = org.getConnection();
      let refList = await connection.metadata.list({ type: 'FunctionReference' });
      refList = ensureArray(refList);

      if (refList) {
        const allReferences = refList.reduce((acc: FullNameReference[], ref) => {
          acc.push(splitFullName(ref.fullName));
          return acc;
        }, []);
        const referencesToRemove = filterProjectReferencesToRemove(allReferences, [], project.name);
        await connection.metadata.delete('FunctionReference', referencesToRemove);
      }

      // Delete the application
      await this.client.delete<Heroku.App>(`/apps/${appName}`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.evergreen',
        },
      });

      cli.action.stop();
    } catch (error) {
      // App with name does not exist
      this.error(
        'Value provided for environment does not match a compute environment name or an alias to a compute environment.'
      );
    }
  }
}
