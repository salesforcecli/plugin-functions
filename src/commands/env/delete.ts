/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import * as Heroku from '@heroku-cli/schema';
import { Org, Messages } from '@salesforce/core';
import { Errors, CliUx } from '@oclif/core';
import {
  filterProjectReferencesToRemove,
  splitFullName,
  FullNameReference,
  ensureArray,
} from '../../lib/function-reference-utils';
import { FunctionsFlagBuilder, confirmationFlag } from '../../lib/flags';
import Command from '../../lib/base';
import batchCall from '../../lib/batch-call';
import { fetchSfdxProject, findOrgExpirationStatus, resolveAppNameForEnvironment, resolveOrg } from '../../lib/utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.delete');

export default class EnvDelete extends Command {
  static summary = messages.getMessage('summary');

  static description = messages.getMessage('description');

  static examples = messages.getMessages('examples');

  static flags = {
    'target-compute': FunctionsFlagBuilder.environment({
      exclusive: ['environment'],
    }),
    environment: FunctionsFlagBuilder.environment({
      char: 'e',
      exclusive: ['target-compute'],
      hidden: true,
    }),
    confirm: confirmationFlag,
  };

  async run() {
    const { flags } = await this.parse(EnvDelete);
    this.postParseHook(flags);

    // We support both versions of the flag here for the sake of backward compat
    const targetCompute = flags['target-compute'] ?? flags.environment;

    if (!targetCompute) {
      throw new Errors.CLIError(
        `Missing required flag:
        -e, --target-compute TARGET-COMPUTE  ${herokuColor.dim('Environment name.')}
       See more help with --help`
      );
    }

    if (flags.environment) {
      this.warn(messages.getMessage('flags.environment.deprecation'));
    }

    await this.confirmRemovePrompt('environment', targetCompute, flags.confirm);

    CliUx.ux.action.start(`Deleting environment ${targetCompute}`);

    if (targetCompute) {
      try {
        // If we are able to successfully create a Salesforce org, then this name does not refer to a compute environment.
        // Regardless of what happens, this block will result in an error.
        const org: Org = await Org.create({ aliasOrUsername: targetCompute });
        if (org) {
          throw new Error(
            `The environment ${herokuColor.cyan(
              targetCompute
            )} is a Salesforce org. The env:delete command currently can only be used to delete compute environments. Please use sfdx force:org:delete to delete scratch and sandbox Salesforce org environments.`
          );
        }
      } catch (err) {
        const error = err as Error;
        // If the error is the one we throw above, then we will send the error to the user.
        // If not (meaning the environment name provided might be a compute environment) then we swallow the error and proceed.
        if (error.message.includes(`The environment ${herokuColor.cyan(targetCompute)} is a Salesforce org.`)) {
          this.error(error);
        }
      }
    }

    // Check if the environment provided is an alias or not, to determine what app name we use to attempt deletion
    const appName = await resolveAppNameForEnvironment(targetCompute);

    let app: Heroku.App;

    try {
      // If app exists, it will be deleted
      const response = await this.client.get<Heroku.App>(`/apps/${appName}`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.evergreen',
        },
      });
      app = response.data;
    } catch (error) {
      // App with name does not exist
      this.error(
        new Error(
          'Value provided for environment does not match a compute environment name or an alias to a compute environment.'
        )
      );
    }

    let connectedOrg: Org | null = null;
    try {
      connectedOrg = await resolveOrg(app?.sales_org_connection?.sales_org_id as string | undefined);
    } catch (err) {
      const error = err as Error;
      // It's possible that they are deleting the compute environment after deleting the org it was
      // connected to, in which case `resolveOrg` will error and we simply want to skip the process
      // of cleaning up function refs since they're all already gone. Otherwise, something else has
      // gone wrong and we go ahead and bail out.
      if (error.message !== 'Attempted to resolve an org without a valid org ID') {
        this.error(error);
      }
    }

    // If we are actually able to resolve an Org instance, it means they are deleting the compute
    // environment while the org still exists, so we need to delete all the function references
    // from the org as part of the cleanup process
    if (connectedOrg) {
      const orgId = connectedOrg.getOrgId();
      const isExpired = await findOrgExpirationStatus(orgId);

      if (!isExpired) {
        const project = await fetchSfdxProject();
        const connection = connectedOrg.getConnection();

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
    }

    // Delete the application
    await this.client.delete<Heroku.App>(`/apps/${appName}`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.evergreen',
      },
    });

    CliUx.ux.action.stop();

    return 'Environment deleted.';
  }
}
