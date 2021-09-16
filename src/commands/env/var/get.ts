/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import * as Heroku from '@heroku-cli/schema';
import { Messages } from '@salesforce/core';
import { FunctionsFlagBuilder } from '../../../lib/flags';

import Command from '../../../lib/base';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.var.get');

export default class VarGet extends Command {
  static description = messages.getMessage('summary');

  static examples = messages.getMessages('examples');

  static flags = {
    'target-compute': FunctionsFlagBuilder.environment({
      required: true,
    }),
  };

  static args = [
    {
      name: 'key',
      required: true,
    },
  ];

  async run() {
    const { flags, args } = await this.parse(VarGet);

    const appName = await this.resolveAppNameForEnvironment(flags['target-compute']);

    const { data: config } = await this.client.get<Heroku.ConfigVars>(`/apps/${appName}/config-vars`);

    const value = config[args.key];

    if (!value) {
      this.warn(
        `No config var named ${herokuColor.cyan(args.key)} found for environment ${herokuColor.cyan(
          flags['target-compute']
        )}`
      );
    }

    this.log(value);
  }
}
