/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import { Errors } from '@oclif/core';
import { cli } from 'cli-ux';
import { Messages } from '@salesforce/core';
import { FunctionsFlagBuilder } from '../../../lib/flags';
import { resolveAppNameForEnvironment } from '../../../lib/utils';
import Command from '../../../lib/base';

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

    const appName = await resolveAppNameForEnvironment(targetCompute);

    if (argv.length === 0) {
      throw new Errors.CLIError('you must enter a config var key (i.e. mykey)');
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
        .join(', ')} and restarting ${herokuColor.app(targetCompute)}`
    );

    await this.client.patch(`/apps/${appName}/config-vars`, {
      data: configPairs,
    });

    cli.action.stop();
  }
}
