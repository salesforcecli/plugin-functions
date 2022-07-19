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

import Command from '../../../lib/base';
import { resolveAppNameForEnvironment } from '../../../lib/utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.var.set');

export default class ConfigSet extends Command {
  static strict = false;

  static summary = messages.getMessage('summary');

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
      cli.warn(messages.getMessage('flags.environment.deprecation'));
    }

    const appName = await resolveAppNameForEnvironment(targetCompute);

    const configPairs = this.parseKeyValuePairs(argv);

    cli.action.start(
      `Setting ${Object.keys(configPairs)
        .map((key) => herokuColor.configVar(key))
        .join(', ')} and restarting ${herokuColor.app(targetCompute)}`
    );

    try {
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
    } catch (error: any) {
      cli.action.stop('failed');
      if (error.data?.message?.includes("Couldn't find that app")) {
        this.error(new Error(`Could not find environment <${appName}>`));
      }
      this.error(error);
    }
  }
}
