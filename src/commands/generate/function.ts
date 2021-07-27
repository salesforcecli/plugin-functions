/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import { Flags } from '@oclif/core';
import { generateFunction, Language } from '@heroku/functions-core';
import Command from '../../lib/base';

/**
 * Based on given language, create function project with specific scaffolding.
 */
export default class GenerateFunction extends Command {
  static description = 'create a function with basic scaffolding specific to a given language';

  static aliases = ['evergreen:function:init'];

  static examples = ['$ sfdx evergreen:function:create MyFunction --language=javascript'];

  static flags = {
    name: Flags.string({
      required: true,
      description: 'function name',
      char: 'n',
    }),
    language: Flags.enum({
      options: ['javascript', 'typescript', 'java'],
      description: 'language',
      char: 'l',
      required: true,
    }),
  };

  async run() {
    const { flags } = await this.parse(GenerateFunction);
    const fnName = flags.name;

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
