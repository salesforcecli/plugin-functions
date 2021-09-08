/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as Heroku from '@heroku-cli/schema';
import { cli } from 'cli-ux';
import { flatMap } from 'lodash';
import { Messages } from '@salesforce/core';
import { FunctionsFlagBuilder } from '../../../lib/flags';
import Command from '../../../lib/base';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.var.list');

export default class ConfigList extends Command {
  static description = messages.getMessage('summary');

  static examples = messages.getMessages('examples');

  static flags = {
    environment: FunctionsFlagBuilder.environment({
      required: true,
    }),
  };

  async run() {
    const { flags } = await this.parse(ConfigList);
    const { environment } = flags;

    const appName = await this.resolveAppNameForEnvironment(environment);

    const { data: config } = await this.client.get<Heroku.ConfigVars>(`/apps/${appName}/config-vars`);

    const configArray = flatMap(config, (value, key) => {
      return {
        key,
        value,
      };
    });

    if (!configArray.length) {
      this.warn(`No config vars found for environment ${environment}`);
      return;
    }

    cli.table(
      configArray,
      {
        key: {
          header: 'Key',
          get: (configVar) => configVar.key,
        },
        value: {
          header: 'Value',
          get: (configVar) => configVar.value,
        },
      },
      {
        printLine: this.log.bind(this),
        ...flags,
      }
    );
  }
}
