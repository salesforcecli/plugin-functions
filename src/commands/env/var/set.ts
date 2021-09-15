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

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.var.set');

export default class ConfigSet extends Command {
  static strict = false;

  static description = messages.getMessage('summary');

  static examples = messages.getMessages('examples');

  static flags = {
    'target-compute': FunctionsFlagBuilder.environment({
      required: true,
    }),
  };

  parseKeyValuePairs(pairs: string[]) {
    if (pairs.length === 0) {
      this.error('Usage: sfdx env:var:set KEY1=VALUE1 [KEY2=VALUE2 ...]\nMust specify KEY and VALUE to set.');
    }

    return pairs.reduce((acc, elem) => {
      if (elem.indexOf('=') === -1) {
        this.error(`${herokuColor.cyan(elem)} is invalid. Please use the format ${herokuColor.cyan('key=value')}`);
      }

      const equalsIndex = elem.indexOf('=');
      const key = elem.slice(0, equalsIndex);
      const value = elem.slice(equalsIndex + 1);

      return { ...acc, [key]: value };
    }, {});
  }

  async run() {
    const { flags, argv } = await this.parse(ConfigSet);

    const appName = await this.resolveAppNameForEnvironment(flags['target-compute']);
    const configPairs = this.parseKeyValuePairs(argv);

    cli.action.start(
      `Setting ${Object.keys(configPairs)
        .map((key) => herokuColor.configVar(key))
        .join(', ')} and restarting ${herokuColor.app(flags['target-compute'])}`
    );

    await this.client.patch(`/apps/${appName}/config-vars`, {
      data: configPairs,
    });

    cli.action.stop();
  }
}
