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
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.var.get');

export default class VarGet extends Command {
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

  static args = [
    {
      name: 'key',
      required: true,
    },
  ];

  async run() {
    const { flags, args } = await this.parse(VarGet);

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

    const { data: config } = await this.client.get<Heroku.ConfigVars>(`/apps/${appName}/config-vars`);

    const value = config[args.key];

    if (flags.json) {
      if (!value) {
        cli.styledJSON({
          status: 0,
          result: null,
          warnings: [`No config var named ${args.key as string} found for environment <${targetCompute}>`],
        });
        return;
      }

      cli.styledJSON({
        status: 0,
        result: value,
        warnings: [],
      });
    } else {
      if (!value) {
        this.warn(
          `No config var named ${herokuColor.cyan(args.key as string)} found for environment ${herokuColor.cyan(
            targetCompute
          )}`
        );
      }
      this.log(value);
    }
  }
}
