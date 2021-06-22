/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import * as Heroku from '@heroku-cli/schema';
import { FunctionsFlagBuilder } from '../../../lib/flags';

import Command from '../../../lib/base';

export default class VarGet extends Command {
  static description = 'display a single config value for an environment';

  static examples = ['$ sfdx env:var:get foo --environment=my-environment'];

  static flags = {
    environment: FunctionsFlagBuilder.environment({
      required: true,
    }),
  };

  static args = [
    {
      name: 'key',
      required: true,
    },
  ];

  async run() {
    const { flags, args } = this.parse(VarGet);
    const { environment } = flags;

    const appName = await this.resolveAppNameForEnvironment(environment);

    const { data: config } = await this.client.get<Heroku.ConfigVars>(`/apps/${appName}/config-vars`);

    const value = config[args.key];

    if (!value) {
      this.warn(
        `No config var named ${herokuColor.cyan(args.key)} found for environment ${herokuColor.cyan(environment)}`
      );
    }

    this.log(value);
  }
}
