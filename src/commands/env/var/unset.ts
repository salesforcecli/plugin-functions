/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import { cli } from 'cli-ux';
import { Messages } from '@salesforce/core';
import { FunctionsFlagBuilder } from '../../../lib/flags';
import Command from '../../../lib/base';
import { resolveAppNameForEnvironment } from '../../../lib/utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.var.unset');

export default class ConfigUnset extends Command {
  static strict = false;

  static description = messages.getMessage('summary');

  static examples = messages.getMessages('examples');

  static flags = {
    environment: FunctionsFlagBuilder.environment({
      required: true,
    }),
  };

  async run() {
    const { flags, argv } = await this.parse(ConfigUnset);
    const { environment } = flags;

    const appName = await resolveAppNameForEnvironment(environment);

    const configPairs = argv.reduce((acc, elem) => {
      return {
        ...acc,
        [elem]: null,
      };
    }, {});

    cli.action.start(
      `Unsetting ${Object.keys(configPairs)
        .map((key) => herokuColor.configVar(key))
        .join(', ')} and restarting ${herokuColor.app(environment)}`
    );

    await this.client.patch(`/apps/${appName}/config-vars`, {
      data: configPairs,
    });

    cli.action.stop();
  }
}
