/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import * as Heroku from '@heroku-cli/schema';
import { flags } from '@oclif/command';
import { cli } from 'cli-ux';
import { FunctionsFlagBuilder } from '../../../lib/flags';
import Command from '../../../lib/base';

export default class LogDrainAdd extends Command {
  static description = 'Add log drain to a specified environment';

  static examples = ['$ sfdx env:logdrain:add --environment=billingApp-Sandbox --url=https://example.com/drain'];

  static flags = {
    environment: FunctionsFlagBuilder.environment({
      required: true,
    }),
    url: flags.string({
      required: true,
      char: 'u',
      description: 'endpoint that will receive sent logs',
    }),
  };

  async run() {
    const { flags } = this.parse(LogDrainAdd);
    const { environment } = flags;

    const appName = await this.resolveAppNameForEnvironment(environment);

    cli.action.start(`Creating drain for environment ${herokuColor.app(environment)}`);

    await this.client.post<Heroku.LogDrain>(`apps/${appName}/log-drains`, {
      data: {
        url: flags.url,
      },
    });

    cli.action.stop();
  }
}
