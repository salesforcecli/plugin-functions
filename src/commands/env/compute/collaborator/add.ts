/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import * as Heroku from '@heroku-cli/schema';
import { Errors, Flags } from '@oclif/core';
import { cli } from 'cli-ux';
import { Messages } from '@salesforce/core';
import { FunctionsFlagBuilder } from '../../../../lib/flags';
import Command from '../../../../lib/base';
import { resolveAppNameForEnvironment } from '../../../../lib/utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.compute.collaborator.add');

export default class ComputeCollaboratorAdd extends Command {
  static summary = messages.getMessage('summary');

  static description = messages.getMessage('description');

  static examples = messages.getMessages('examples');

  static flags = {
    'heroku-user': FunctionsFlagBuilder.environment({
      char: 'h',
      required: true,
    }),
  };

  async run() {
    const { flags } = await this.parse(ComputeCollaboratorAdd);
    // We support both versions of the flag here for the sake of backward compat
    const herokuUser = flags['heroku-user'];

    if (!herokuUser) {
      throw new Errors.CLIError(
        `Missing required flag:
        -c, --heroku-user heroku-user  ${herokuColor.dim('Environment name.')}
       See more help with --help`
      );
    }

    const appName = await resolveAppNameForEnvironment(herokuUser);

    cli.action.start(`Creating drain for environment ${herokuColor.app(herokuUser)}`);

    // Add this POST

    //   curl -v POST https://api.heroku.com/salesforce-orgs/collaborators \
    // -H 'Accept: application/vnd.heroku+json; version=3.evergreen' \
    // -H "Authorization: Bearer $FUNCTIONS_TOKEN" \
    // -d "user=$HEROKU_USER"

    await this.client.post<Heroku.LogDrain>(`/apps/${appName}/log-drains`, {
      data: {
        // url,
      },
    });

    cli.action.stop();
  }
}
