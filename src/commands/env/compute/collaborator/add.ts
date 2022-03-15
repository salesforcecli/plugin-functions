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

  static examples = messages.getMessages('examples');

  static flags = {
    'heroku-user': FunctionsFlagBuilder.environment({
      char: 'h',
      description: messages.getMessage('flags.heroku-user.summary'),
      required: true,
    }),
  };

  async run() {
    const { flags } = await this.parse(ComputeCollaboratorAdd);
    const herokuUser = flags['heroku-user'];

    if (!herokuUser) {
      throw new Errors.CLIError(
        `Missing required flag:
        -h, --heroku-user example@heroku.com  ${herokuColor.dim('Heroku user email address.')}
       See more help with --help`
      );
    }

    cli.action.start(
      `Adding Heroku user ${herokuColor.heroku(herokuUser)} as a collaborator on this Functions account`
    );

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
        this.error(`${herokuColor.heroku(herokuUser)} is already a collaborator to this Functions account.`);
      }

      if (error.message?.includes('404')) {
        this.error(`${herokuColor.heroku(herokuUser)} does not exist.`);
      }

      this.error(error.message);
    }

    cli.action.stop();
    this.log(
      'For more information about attaching Heroku add-ons to your compute environments, run $ heroku addons:attach --help.'
    );
  }
}
