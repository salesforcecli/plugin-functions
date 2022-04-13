/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { Command, Flags } from '@oclif/core';
import { LocalRun } from '@hk/functions-core';
import { Messages } from '@salesforce/core';

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
      char: 'b',
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
    await this.runWithFlags(flags);
  }

  async runWithFlags(
    flags: { path: string; port: number; 'debug-port': number; language: string } & { json: boolean | undefined }
  ) {
    const localRun = new LocalRun(flags.language, {
      path: flags.path,
      port: flags.port,
      debugPort: flags['debug-port'],
    });
    await localRun.exec();
  }
}
