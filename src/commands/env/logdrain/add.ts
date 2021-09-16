/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import * as Heroku from '@heroku-cli/schema';
import { Flags } from '@oclif/core';
import { cli } from 'cli-ux';
import { Messages } from '@salesforce/core';
import { FunctionsFlagBuilder } from '../../../lib/flags';
import Command from '../../../lib/base';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.logdrain.add');

export default class LogDrainAdd extends Command {
  static description = messages.getMessage('summary');

  static examples = messages.getMessages('examples');

  static flags = {
    'target-compute': FunctionsFlagBuilder.environment({
      required: true,
    }),
    'drain-url': Flags.string({
      required: true,
      char: 'l',
      description: messages.getMessage('flags.url.summary'),
    }),
  };

  async run() {
    const { flags } = await this.parse(LogDrainAdd);

    const appName = await this.resolveAppNameForEnvironment(flags['target-compute']);

    cli.action.start(`Creating drain for environment ${herokuColor.app(flags['target-compute'])}`);

    await this.client.post<Heroku.LogDrain>(`apps/${appName}/log-drains`, {
      data: {
        url: flags['drain-url'],
      },
    });

    cli.action.stop();
  }
}
