/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import * as Heroku from '@heroku-cli/schema';
import { Org, Messages } from '@salesforce/core';
import { cli } from 'cli-ux';
import {
  filterProjectReferencesToRemove,
  splitFullName,
  FullNameReference,
  ensureArray,
} from '../../lib/function-reference-utils';
import { FunctionsFlagBuilder, confirmationFlag } from '../../lib/flags';
import Command from '../../lib/base';
import batchCall from '../../lib/batch-call';
import { fetchSfdxProject } from '../../lib/utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.delete');

export default class EnvDelete extends Command {
  static description = messages.getMessage('summary');

  static examples = messages.getMessages('examples');

  static flags = {
    environment: FunctionsFlagBuilder.environment({
      required: true,
    }),
    confirm: confirmationFlag,
  };

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

    let app: Heroku.App;

    try {
      // If app exists, it will be deleted
      app = await this.client.get<Heroku.App>(`/apps/${appName}`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.evergreen',
        },
      });
    } catch (error) {
      // App with name does not exist
      this.error(
        'Value provided for environment does not match a compute environment name or an alias to a compute environment.'
      );
    }

    let org: Org | null = null;
    try {
      org = await this.resolveOrg(app.data.sales_org_connection?.sales_org_id);
    } catch (error) {
      // It's possible that they are deleting the compute environment after deleting the org it was
      // connected to, in which case `resolveOrg` will error and we simply want to skip the process
      // of cleaning up functon refs since they're all already gone. Otherwise, something else has
      // gone wrong and we go ahead and bail out.
      if (error.message !== 'Attempted to resolve an org without an org ID or defaultusername value') {
        this.error;
      }
    }

    // If we are actually able to resolve an Org instance, it means they are deleting the compute
    // environment while the org still exists, so we need to delete all the function references
    // from the org as part of the cleanup process
    if (org) {
      const project = await fetchSfdxProject();
      const connection = org.getConnection();
      let refList = await connection.metadata.list({ type: 'FunctionReference' });
      refList = ensureArray(refList);

      if (refList && refList.length) {
        const allReferences = refList.reduce((acc: FullNameReference[], ref) => {
          acc.push(splitFullName(ref.fullName));
          return acc;
        }, []);
        const referencesToRemove = filterProjectReferencesToRemove(allReferences, [], project.name);
        await batchCall(referencesToRemove, (chunk) => connection.metadata.delete('FunctionReference', chunk));
      }
    }

    // Delete the application
    await this.client.delete<Heroku.App>(`/apps/${appName}`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.evergreen',
      },
    });

    cli.action.stop();
  }
}
