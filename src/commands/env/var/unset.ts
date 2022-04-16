/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import * as Heroku from '@heroku-cli/schema';
import { Messages } from '@salesforce/core';
import { Errors } from '@oclif/core';
import { cli } from 'cli-ux';
import { FunctionsFlagBuilder } from '../../../lib/flags';

import Command from '../../../lib/base';
import { resolveAppNameForEnvironment } from '../../../lib/utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.var.unset');

export default class ConfigUnset extends Command {
  static strict = false;

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
    json: FunctionsFlagBuilder.json,
  };

  async run() {
    const { flags, argv } = await this.parse(ConfigUnset);

    // We support both versions of the flag here for the sake of backward compat
    const targetCompute = flags['target-compute'] ?? flags.environment;

    if (!targetCompute) {
      throw new Errors.CLIError(
        `Missing required flag:
        -c, --target-compute TARGET-COMPUTE  ${herokuColor.dim('Environment name.')}
       See more help with --help`
      );
    }

    if (flags.environment) {
      this.warn(messages.getMessage('flags.environment.deprecation'));
    }

    if (argv.length === 0) {
      throw new Errors.CLIError('You must enter a config var key (i.e. mykey).');
    }

    const appName = await resolveAppNameForEnvironment(targetCompute);

    try {
      const { data: config } = await this.client.get<Heroku.ConfigVars>(`/apps/${appName}/config-vars`);
      const value = config[argv[0]];
      if (!value) {
        throw new Error();
      }
    } catch (error) {
      // Config var does not exist
      this.handleError(
        new Error('Value provided for key does not match a config var found for environment.'),
        flags.json
      );
    }

    const configPairs = argv.reduce((acc: any, elem: any) => {
      return {
        ...acc,
        [elem]: null,
      };
    }, {});

    cli.action.start(
      `Unsetting ${Object.keys(configPairs)
        .map((key) => herokuColor.configVar(key))
        .join(', ')} and restarting ${herokuColor.app(targetCompute)}`
    );

    await this.client.patch(`/apps/${appName}/config-vars`, {
      data: configPairs,
    });

    cli.action.stop();
    if (flags.json) {
      cli.styledJSON({
        status: 0,
        result: null,
        warnings: [],
      });
    }
  }
}
