/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import { cli } from 'cli-ux';
import { FunctionsFlagBuilder } from '../../../lib/flags';
import Command from '../../../lib/base';

export default class ConfigUnset extends Command {
  static strict = false;

  static description = 'unset a single config value for an environment';

  static examples = ['$ sfdx env:var:unset foo --environment=my-environment'];

  static flags = {
    environment: FunctionsFlagBuilder.environment({
      required: true,
    }),
  };

  async run() {
    const { flags, argv } = this.parse(ConfigUnset);
    const { environment } = flags;

    const appName = await this.resolveAppNameForEnvironment(environment);

    const configPairs = argv.reduce((acc, elem) => {
      return {
        ...acc,
        [elem]: null,
      };
    }, {});

    cli.action.start(
      `Unsetting ${Object.keys(configPairs)
        .map((key) => herokuColor.configVar(key))
        .join(', ')} and restarting ${herokuColor.app(environment)}`
    );

    await this.client.patch(`/apps/${appName}/config-vars`, {
      data: configPairs,
    });

    cli.action.stop();
  }
}
