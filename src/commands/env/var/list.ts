/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as Heroku from '@heroku-cli/schema';
import herokuColor from '@heroku-cli/color';
import { flatMap } from 'lodash';
import { Messages } from '@salesforce/core';
import { Errors, CliUx } from '@oclif/core';
import { FunctionsFlagBuilder } from '../../../lib/flags';
import Command from '../../../lib/base';
import { resolveAppNameForEnvironment } from '../../../lib/utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.var.list');

export default class ConfigList extends Command {
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
  };

  async run() {
    const { flags } = await this.parse(ConfigList);
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

    const appName = await resolveAppNameForEnvironment(targetCompute);

    const { data: config } = await this.client.get<Heroku.ConfigVars>(`/apps/${appName}/config-vars`);

    const configArray = flatMap(config, (value, key) => ({
        key,
        value,
      }));

    if (configArray.length === 0) {
      this.warn(`No config vars found for environment ${targetCompute}`);
    } else {
      CliUx.ux.table(
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
    return config;
  }
}
