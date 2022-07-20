/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as Heroku from '@heroku-cli/schema';
import herokuColor from '@heroku-cli/color';
import { cli } from 'cli-ux';
import { Messages } from '@salesforce/core';
import { Errors } from '@oclif/core';
import { FunctionsFlagBuilder } from '../../../lib/flags';
import Command from '../../../lib/base';
import { resolveAppNameForEnvironment } from '../../../lib/utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.logdrain.list');

export default class LogDrainList extends Command {
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
  };

  async run() {
    const { flags } = await this.parse(LogDrainList);
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

    const { data: drains } = await this.client.get<Heroku.LogDrain[]>(`/apps/${appName}/log-drains`);

    if (flags.json) {
      if (drains.length === 0) {
        this.warn(`No logdrain found for environment <${appName}>`);
      }

      return drains;
    } else {
      if (drains.length === 0) {
        this.log(`No log drains found for environment ${targetCompute}.`);
      } else {
        cli.table<Heroku.LogDrain>(
          drains,
          {
            id: {
              header: 'ID',
              get: (row) => row.id,
            },
            url: {
              header: 'URL',
              get: (row) => row.url,
            },
          },
          {
            printLine: this.log.bind(this),
            ...flags,
          }
        );
      }
    }
  }
}
