/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as fs from 'fs';
import * as path from 'path';
import { Command, Errors, Flags } from '@oclif/core';
import { runFunction, RunFunctionOptions } from '@heroku/functions-core';
import { cli } from 'cli-ux';
import herokuColor from '@heroku-cli/color';
import { AxiosResponse } from 'axios';
import { ConfigAggregator, Messages } from '@salesforce/core';
import LocalRun from '../../../../lib/local-run';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'run.function.start.local');

export default class Local extends Command {
  static description = messages.getMessage('summary');

  static examples = messages.getMessages('examples');

  static flags = {
    path: Flags.string({
      description: messages.getMessage('flags.path.summary'),
      default: path.resolve('.'),
      hidden: true,
    }),
    port: Flags.integer({
      char: 'p',
      description: messages.getMessage('flags.port.summary'),
      default: 8080,
    }),
    'debug-port': Flags.integer({
      char: 'd',
      description: messages.getMessage('flags.debug-port.summary'),
      default: 9229,
    }),
    language: Flags.enum({
      options: ['javascript', 'typescript', 'java', 'auto'],
      description: messages.getMessage('flags.language.summary'),
      char: 'l',
      default: 'auto',
    }),
  };

  async run() {
    const { flags } = await this.parse(Local);
    const localRun = new LocalRun({
      path: flags.path,
      port: flags.port,
      debugPort: flags['debug-port'],
      language: flags.language,
    });
    localRun.on('info', (message: string) => cli.info(message));
    await localRun.exec();
  }
}
