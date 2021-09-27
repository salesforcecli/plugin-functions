/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Errors, Flags } from '@oclif/core';
import herokuColor from '@heroku-cli/color';
import { Messages } from '@salesforce/core';
import { generateProject } from '@heroku/functions-core';
import Command from '../../lib/base';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'generate.project');
export default class GenerateProject extends Command {
  static examples = messages.getMessages('examples');

  static flags = {
    'project-name': Flags.string({
      exclusive: ['name'],
      description: messages.getMessage('flags.project-name.summary'),
      char: 'n',
    }),
    name: Flags.string({
      exclusive: ['project-name'],
      description: messages.getMessage('flags.project-name.summary'),
      char: 'n',
      hidden: true,
    }),
  };

  async run() {
    const { flags } = await this.parse(GenerateProject);
    const pnName = flags['project-name'] ?? flags.name;

    if (!pnName) {
      throw new Errors.CLIError(
        `Missing required flag:
       -n, --project-name PROJECT-NAME  ${herokuColor.dim('Name of the generated project.')}
       See more help with --help`
      );
    }

    if (flags.name) {
      this.warn(messages.getMessage('flags.name.deprecation'));
    }
    try {
      await generateProject(pnName);
    } catch (err) {
      this.error(err.message);
    }
  }
}
