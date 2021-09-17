/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import * as Heroku from '@heroku-cli/schema';
import { Errors } from '@oclif/core';
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

    if (argv.length === 0) {
      throw new Errors.CLIError('you must enter a config var key (i.e. mykey)');
    }

    const { data: config } = await this.client.get<Heroku.ConfigVars>(`/apps/${appName}/config-vars`);

    const value = config[argv[0]];

    if (!value) {
      throw new Errors.CLIError(
        `No config var named ${herokuColor.cyan(argv[0])} found for environment ${herokuColor.cyan(
          flags['target-compute']
        )}`
      );
    }

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
