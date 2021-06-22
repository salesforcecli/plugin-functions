/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as Heroku from '@heroku-cli/schema';
import { Flags } from '@oclif/core';
import { cli } from 'cli-ux';
import { FunctionsFlagBuilder } from '../../../lib/flags';
import Command from '../../../lib/base';

export default class LogDrainList extends Command {
  static description = 'List log drains connected to a specified environment';

  static examples = ['$ sfdx env:logdrain:list --environment=billingApp-Sandbox'];

  static flags = {
    environment: FunctionsFlagBuilder.environment({
      required: true,
    }),
    json: Flags.boolean({
      description: 'output result in json',
    }),
  };

  async run() {
    const { flags } = await this.parse(LogDrainList);
    const { environment } = flags;

    const appName = await this.resolveAppNameForEnvironment(environment);

    const { data: drains } = await this.client.get<Heroku.LogDrain[]>(`apps/${appName}/log-drains`);

    if (flags.json) {
      cli.styledJSON(drains);
      return;
    }

    if (drains.length === 0) {
      this.log(`No log drains found for environment ${environment}.`);
      return;
    }

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
