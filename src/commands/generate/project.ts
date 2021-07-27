/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Flags } from '@oclif/core';
import { generateProject } from '@heroku/functions-core';
import Command from '../../lib/base';
export default class GenerateProject extends Command {
  static flags = {
    name: Flags.string({
      description: 'name of the generated project',
      char: 'n',
      required: true,
    }),
  };

  async run() {
    const { flags } = await this.parse(GenerateProject);
    try {
      await generateProject(flags.name);
    } catch (err) {
      this.error(err.message);
    }
  }
}
