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
    const herokuUser = flags['heroku-user'];

    if (!herokuUser) {
      throw new Errors.CLIError(
        `Missing required flag:
        -c, --heroku-user heroku-user  ${herokuColor.dim('Heroku user name.')}
       See more help with --help`
      );
    }

    cli.action.start(`Adding collaborator ${herokuColor.heroku(herokuUser)} to compute environments.`);

    try {
      await this.client.post<Heroku.Collaborator>('/salesforce-orgs/collaborators', {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.evergreen',
          Authorization: `Bearer ${this.auth}`,
        },
        data: {
          user: herokuUser,
        },
      });
    } catch (e) {
      const error = e as Error;

      if (error.message?.includes('409')) {
        this.error(`Collaborator ${herokuColor.heroku(herokuUser)} has already been added.`);
      }

      if (error.message?.includes('404')) {
        this.error(`There is no Heroku User under the username ${herokuColor.heroku(herokuUser)}.`);
      }

      this.error(error.message);
    }

    cli.action.stop();
  }
}
