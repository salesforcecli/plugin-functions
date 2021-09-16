/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import { Messages } from '@salesforce/core';
import { Flags } from '@oclif/core';
import { generateFunction, Language } from '@heroku/functions-core';
import Command from '../../lib/base';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'generate.function');

/**
 * Based on given language, create function project with specific scaffolding.
 */
export default class GenerateFunction extends Command {
  static description = messages.getMessage('summary');

  static examples = messages.getMessages('examples');

  static flags = {
    'function-name': Flags.string({
      required: true,
      description: messages.getMessage('flags.name.summary'),
      char: 'n',
    }),
    language: Flags.enum({
      options: ['javascript', 'typescript', 'java'],
      description: messages.getMessage('flags.language.summary'),
      char: 'L',
      required: true,
    }),
  };

  async run() {
    const { flags } = await this.parse(GenerateFunction);
    const fnName = flags['function-name'];

    try {
      const { name, path, language, welcomeText } = await generateFunction(fnName, flags.language as Language);
      this.log(`Created ${language} function ${herokuColor.green(name)} in ${herokuColor.green(path)}.`);
      if (welcomeText) {
        this.log('');
        this.log(welcomeText);
      }
    } catch (err) {
      this.error(err.message);
    }
  }
}
