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
import { FunctionsFlagBuilder, confirmationFlag } from '../../lib/flags';
import Command from '../../lib/base';
import {sortBy} from 'lodash'
import {differenceWith, isEqual} from 'lodash'
import {OrgListUtil} from '@salesforce/plugin-org/lib/shared/orgListUtil'
interface FullNameReference {
  project: string;
  fn: string;
}

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

  private filterProjectReferencesToRemove(
    allReferences: Array<FullNameReference>,
    successfulReferences: Array<FullNameReference>,
    projectName: string,
  ) {
    const filtered = allReferences.filter(ref => ref.project === projectName)
    return differenceWith(filtered, successfulReferences, isEqual).map(ref => `${ref.project}-${ref.fn}`)
  }

  private splitFullName(fullName: string): FullNameReference {
    const [project, fn] = fullName.split('-')
    return {
      project,
      fn,
    }
  }

  async resolveScratchOrg(scratchOrgId: string) {
    // adapted from https://github.com/salesforcecli/plugin-org/blob/3012cc04a670e4bf71e75a02e2f0981a71eb4e0d/src/commands/force/org/list.ts#L44-L90
    let fileNames: Array<string> = []
    try {
      fileNames = await AuthInfo.listAllAuthFiles()
    } catch (error) {
      if (error.name === 'NoAuthInfoFound') {
        this.error('No orgs found')
      } else {
        throw error
      }
    }

    const metaConfigs = await OrgListUtil.readLocallyValidatedMetaConfigsGroupedByOrgType(fileNames, {})

    const scratchOrgs = sortBy(metaConfigs.scratchOrgs, v => [v.alias, v.username])
    return scratchOrgs.find(org => org.orgId === scratchOrgId)
  }

  async run() {
    const { flags } = this.parse(EnvDelete);

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

      // Get the sales org id
      const app = await this.client.get<Heroku.App>(`/apps/${appName}`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.evergreen',
        },
      })

      const connectedOrg = await this.resolveScratchOrg(app.data.sales_org_connection.sales_org_id)
      const connectedOrgAlias = connectedOrg?.alias
      const project = await this.fetchSfdxProject()
      const org = await this.fetchOrg(connectedOrgAlias)
      const connection = org.getConnection()
      console.log('here')
      const refList = await connection.metadata.list({type: 'FunctionReference'})
      if (refList) {
        const allReferences = refList.reduce(
          (acc: Array<FullNameReference>, ref) => {
            acc.push(this.splitFullName(ref.fullName))
            return acc
          },
          [],
        )
        console.log('here')
        const referencesToRemove = this.filterProjectReferencesToRemove(allReferences, [], project.name)
        console.log('here')
        await connection.metadata.delete('FunctionReference', referencesToRemove)
        console.log('here')
      }

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
