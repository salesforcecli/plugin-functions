/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as Heroku from '@heroku-cli/schema';
import { cli } from 'cli-ux';
import { Messages } from '@salesforce/core';
import { FunctionsFlagBuilder } from '../../../lib/flags';
import Command from '../../../lib/base';
import { resolveAppNameForEnvironment } from '../../../lib/utils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.logdrain.list');

export default class LogDrainList extends Command {
  static description = messages.getMessage('summary');

  static examples = messages.getMessages('examples');

  static flags = {
    environment: FunctionsFlagBuilder.environment({
      required: true,
    }),
    json: FunctionsFlagBuilder.json,
  };

  async run() {
    const { flags } = await this.parse(LogDrainList);

    const appName = await resolveAppNameForEnvironment(flags.environment);

    const { data: drains } = await this.client.get<Heroku.LogDrain[]>(`apps/${appName}/log-drains`);

    if (flags.json) {
      cli.styledJSON(drains);
      return;
    }

    if (drains.length === 0) {
      this.log(`No log drains found for environment ${flags.environment}.`);
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
