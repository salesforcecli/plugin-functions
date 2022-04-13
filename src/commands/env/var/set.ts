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

  parseErrors(errorObject: any, targetCompute: string) {
    // may have create a cleaner way to parse the errors
    // to fit the sfdx json error object, but this currently works

    const errObj = errorObject.stack;
    const isInvalidEnvironment = errObj.includes("Error: Couldn't");
    const hasNoInput = errObj.includes('Error: Usage:');
    const isInvalidInput = !hasNoInput;

    if (isInvalidEnvironment) {
      const errorStackStartIndex = errObj.indexOf('at');
      const errStack = errObj.substr(errorStackStartIndex);

      cli.styledJSON({
        status: 1,
        name: 'Error',
        message: `Couldn't find that app <${targetCompute}>`,
        exitCode: 1,
        commandName: 'env var set',
        stack: errStack,
        warnings: [],
      });
      return;
    }

    if (isInvalidInput) {
      const errorIndex = errObj.indexOf(':') + 1;
      const keyValueIndex = errObj.indexOf('value') + 5;

      // eslint-disable-next-line no-control-regex
      const errMessage = errObj
        .substr(errorIndex, keyValueIndex)
        // eslint-disable-next-line no-control-regex
        .replace(/\u001b\[.*?m/g, '')
        .replace('\n', '')
        .replace(' ', '');
      // eslint-disable-next-line no-control-regex
      const errStack = errObj
        .substr(keyValueIndex)
        // eslint-disable-next-line no-control-regex
        .replace(/\u001b\[.*?m\r?\n|\r/g, '')
        .replace('    ', '');

      cli.styledJSON({
        status: 1,
        name: 'Error',
        message: errMessage,
        exitCode: 1,
        commandName: 'env var set',
        stack: errStack,
        warnings: [],
      });
      return;
    }

    if (hasNoInput) {
      const errorStackStartIndex = errObj.indexOf('at');
      const errStack = errObj.substr(errorStackStartIndex);

      cli.styledJSON({
        status: 1,
        name: 'Error',
        message: 'Must specify KEY and VALUE to set.',
        exitCode: 1,
        commandName: 'env var set',
        stack: errStack,
        warnings: [],
      });
      return;
    }
  }

  async run() {
    const { flags, argv } = await this.parse(ConfigSet);
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

    if (flags.json) {
      try {
        const configPairs = this.parseKeyValuePairs(argv);

        await this.client.patch(`/apps/${appName}/config-vars`, {
          data: configPairs,
        });

        cli.styledJSON({
          status: 0,
          result: null,
          warnings: [],
        });
        return;
      } catch (err: any) {
        this.parseErrors(err, targetCompute);
      }
    } else {
      const configPairs = this.parseKeyValuePairs(argv);

      cli.action.start(
        `Setting ${Object.keys(configPairs)
          .map((key) => herokuColor.configVar(key))
          .join(', ')} and restarting ${herokuColor.app(targetCompute)}`
      );

      await this.client.patch(`/apps/${appName}/config-vars`, {
        data: configPairs,
      });

      cli.action.stop();
    }
  }
}
