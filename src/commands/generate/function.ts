/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import { Messages } from '@salesforce/core';
import { cli } from 'cli-ux';
import { Errors, Flags } from '@oclif/core';
import { generateFunction, Language } from '@hk/functions-core';
import Command from '../../lib/base';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'generate.function');

/**
 * Based on given language, create function project with specific scaffolding.
 */
export default class GenerateFunction extends Command {
  static enableJsonFlag = false;

  static summary = messages.getMessage('summary');

  static description = messages.getMessage('description');

  static examples = messages.getMessages('examples');

  static flags = {
    'function-name': Flags.string({
      exclusive: ['name'],
      description: messages.getMessage('flags.function-name.summary'),
      char: 'n',
    }),
    name: Flags.string({
      exclusive: ['function-name'],
      description: messages.getMessage('flags.function-name.summary'),
      char: 'n',
      hidden: true,
    }),
    language: Flags.enum({
      options: ['javascript', 'typescript', 'java'],
      description: messages.getMessage('flags.language.summary'),
      char: 'l',
      required: true,
    }),
  };

  async run() {
    const { flags } = await this.parse(GenerateFunction);
    const fnName = flags['function-name'] ?? flags.name;

    if (!fnName) {
      throw new Errors.CLIError(
        `Missing required flag:
       -n, --function-name FUNCTION-NAME  ${herokuColor.dim('Function name.')}
       See more help with --help`
      );
    }

    if (flags.name) {
      cli.warn(messages.getMessage('flags.name.deprecation'));
    }

    const { name, path, language, welcomeText } = await generateFunction(fnName, flags.language as Language);
    this.log(`Created ${language} function ${herokuColor.green(name)} in ${herokuColor.green(path)}.`);
    if (welcomeText) {
      this.log('');
      this.log(welcomeText);
    }
  }
}
