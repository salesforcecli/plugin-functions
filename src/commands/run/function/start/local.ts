/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import * as process from 'process';
import { Command, Flags } from '@oclif/core';
import { Language, LocalRun } from '@heroku/functions-core';
import { Messages } from '@salesforce/core';
import { LangRunnerOpts } from '@heroku/functions-core/dist/lang-runner';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'run.function.start.local');

// TODO: Make sf-functions-core export the list of language options it supports
// for the local functions runners, and use that instead of hardcoding here.
// See W-12120598.
export const languageOptions = ['auto', 'java', 'javascript', 'typescript'];

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
    language: Flags.custom<Language | 'auto'>({
      options: languageOptions,
    })({
      description: messages.getMessage('flags.language.summary'),
      char: 'l',
      default: 'auto',
    }),
  };

  // using a static to override the LocalRun constructor based on suggestion from https://github.com/oclif/oclif/issues/41
  static createLocalRun = (lang?: string, runnerOpts?: LangRunnerOpts) => {
    return new LocalRun(lang, runnerOpts);
  };

  async run() {
    const { flags } = await this.parse(Local);
    await this.runWithFlags(flags);
  }

  async runWithFlags(
    flags: { path: string; port: number; 'debug-port': number; language: string } & { json: boolean | undefined }
  ) {
    this.debug('running function locally');

    const localRun = Local.createLocalRun(flags.language, {
      path: flags.path,
      port: flags.port,
      debugPort: flags['debug-port'],
    });

    const localRunProcess = await localRun.exec();

    process.on('SIGINT', () => {
      localRunProcess.cancel();
    });

    await new Promise<void>((resolve) => {
      localRunProcess.on('close', resolve);
    });

    this.debug('locally running function finished');
  }
}
