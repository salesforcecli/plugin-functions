/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import { cli } from 'cli-ux';
import * as Heroku from '@heroku-cli/schema';
import { Messages } from '@salesforce/core';
import { Errors, Flags } from '@oclif/core';
import { FunctionsFlagBuilder } from '../../lib/flags';
import Command from '../../lib/base';
import { resolveAppNameForEnvironment } from '../../lib/utils';
import * as logStreamUtils from '../../lib/log-stream-utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.log');

export default class Log extends Command {
  static summary = messages.getMessage('summary');

  static examples = messages.getMessages('examples');

  static flags = {
    'target-compute': FunctionsFlagBuilder.environment({
      description: messages.getMessage('flags.target-compute.summary'),
      exclusive: ['environment'],
    }),
    environment: FunctionsFlagBuilder.environment({
      char: 'e',
      exclusive: ['target-compute'],
      hidden: true,
    }),
    num: Flags.integer({
      char: 'n',
      description: messages.getMessage('flags.num.summary'),
    }),
  };

  async run() {
    const { flags } = await this.parse(Log);
    // We support both versions of the flag here for the sake of backward compat
    const targetCompute = flags['target-compute'] ?? flags.environment;
    const logLines = flags.num ?? 100;

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

    const response = await this.client.post<Heroku.LogSession>(`/apps/${appName}/log-sessions`, {
      data: {
        tail: false,
        lines: logLines,
      },
    });

    const logURL = response.data.logplex_url;

    if (logURL) {
      await logStreamUtils.readLogs(logURL, false);
    } else {
      this.error("Couldn't retreive logs");
    }
    cli.action.stop();
  }
}
