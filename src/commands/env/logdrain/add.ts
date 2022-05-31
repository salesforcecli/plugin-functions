/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import * as Heroku from '@heroku-cli/schema';
import { Errors, Flags } from '@oclif/core';
import { cli } from 'cli-ux';
import { Messages } from '@salesforce/core';
import { FunctionsFlagBuilder } from '../../../lib/flags';
import Command from '../../../lib/base';
import { resolveAppNameForEnvironment } from '../../../lib/utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.logdrain.add');

export default class LogDrainAdd extends Command {
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
    'drain-url': Flags.string({
      exclusive: ['url'],
      char: 'l',
      description: messages.getMessage('flags.drain-url.summary'),
    }),
    url: Flags.string({
      exclusive: ['drain-url'],
      char: 'u',
      description: messages.getMessage('flags.drain-url.summary'),
      hidden: true,
    }),
  };

  async run() {
    const { flags } = await this.parse(LogDrainAdd);
    // We support both versions of the flag here for the sake of backward compat
    const targetCompute = flags['target-compute'] ?? flags.environment;
    const url = flags['drain-url'] ?? flags.url;

    if (!targetCompute) {
      throw new Errors.CLIError(
        `Missing required flag:
        -c, --target-compute TARGET-COMPUTE  ${herokuColor.dim('Environment name.')}
       See more help with --help`
      );
    }

    if (!url) {
      throw new Errors.CLIError(
        `Missing required flag:
       -u, --drain-url DRAIN-URL  ${herokuColor.dim('Endpoint that will receive sent logs.')}
       See more help with --help`
      );
    }

    if (flags.environment) {
      cli.warn(messages.getMessage('flags.environment.deprecation'));
    }

    if (flags.url) {
      cli.warn(messages.getMessage('flags.url.deprecation'));
    }

    const appName = await resolveAppNameForEnvironment(targetCompute);

    cli.action.start(`Creating drain for environment ${herokuColor.app(targetCompute)}`);

    await this.client.post<Heroku.LogDrain>(`/apps/${appName}/log-drains`, {
      data: {
        url,
      },
    });

    cli.action.stop();
  }
}
