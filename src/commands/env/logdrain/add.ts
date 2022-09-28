/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import * as Heroku from '@heroku-cli/schema';
import { Flags } from '@salesforce/sf-plugins-core';
import { Errors, CliUx } from '@oclif/core';
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
    this.postParseHook(flags);

    // We support both versions of the flag here for the sake of backward compat
    const targetCompute = flags['target-compute'] ?? flags.environment;
    const url = flags['drain-url'] ?? flags.url;

    if (!targetCompute) {
      throw new Errors.CLIError(
        `Missing required flag:
        -e, --target-compute TARGET-COMPUTE  ${herokuColor.dim('Environment name.')}
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
      this.warn(messages.getMessage('flags.environment.deprecation'));
    }

    if (flags.url) {
      this.warn(messages.getMessage('flags.url.deprecation'));
    }
    const appName = await resolveAppNameForEnvironment(targetCompute);

    try {
      CliUx.ux.action.start(`Creating drain for environment ${herokuColor.app(targetCompute)}`);

      const result = await this.client.post<Heroku.LogDrain>(`/apps/${appName}/log-drains`, {
        data: {
          url,
        },
      });

      CliUx.ux.action.stop();

      return [
        {
          addon: null,
          created_at: result.data.created_at,
          id: result.data.id,
          token: result.data.token,
          updated_at: result.data.updated_at,
          url: result.data.url,
        },
      ];
    } catch (e) {
      const error = e as { data: { message?: string } };

      if (error.data?.message?.includes('Url is invalid')) {
        this.error(new Error(`URL is invalid ${url}`));
      }

      if (error.data?.message?.includes('Url has already been taken')) {
        this.error(new Error(`Logdrain URL is already added ${url}`));
      }

      if (error.data?.message?.includes("Couldn't find that app")) {
        this.error(new Error(`Could not find environment ${appName}`));
      }

      if (error.data?.message?.includes("You've reached the limit")) {
        this.error(new Error(`You've reached the limit of 5 log drains on ${appName}`));
      }

      if (error.data?.message?.includes('401')) {
        this.error(new Error('Your token has expired, please login with sf login functions'));
      }

      this.error(e as Error);
    }
  }
}
