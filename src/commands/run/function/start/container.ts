/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import herokuColor from '@heroku-cli/color';
import { Messages } from '@salesforce/core';
import { Command, Flags } from '@oclif/core';
import { getFunctionsBinary, getProjectDescriptor } from '@hk/functions-core';
import { cli } from 'cli-ux';
import { JsonMap } from '@salesforce/ts-types';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'run.function.start.container');

export default class Container extends Command {
  static summary = messages.getMessage('summary');

  static description = messages.getMessage('description');

  static examples = messages.getMessages('examples');

  static flags = {
    builder: Flags.string({
      description: messages.getMessage('flags.builder.summary'),
      hidden: true,
    }),
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
    'clear-cache': Flags.boolean({
      description: messages.getMessage('flags.clear-cache.summary'),
    }),
    'no-pull': Flags.boolean({
      description: messages.getMessage('flags.no-pull.summary'),
    }),
    'no-build': Flags.boolean({
      description: messages.getMessage('flags.no-build.summary'),
      hidden: true,
    }),
    'no-run': Flags.boolean({
      description: messages.getMessage('flags.no-run.summary'),
      hidden: true,
    }),
    env: Flags.string({
      char: 'e',
      description: messages.getMessage('flags.env.summary'),
      multiple: true,
    }),
    network: Flags.string({
      description: messages.getMessage('flags.network.summary'),
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: messages.getMessage('flags.verbose.summary'),
    }),
    descriptor: Flags.string({
      description: messages.getMessage('flags.descriptor.summary'),
      hidden: true,
    }),
  };

  async run() {
    const { flags } = await this.parse(Container);

    const buildOpts = {
      builder: flags.builder,
      'clear-cache': flags['clear-cache'],
      'no-pull': flags['no-pull'],
      network: flags.network,
      env: flags.env,
      descriptor: flags.descriptor ?? path.resolve(flags.path, 'project.toml'),
      path: flags.path,
    };

    const runOpts = {
      port: flags.port,
      'debug-port': flags['debug-port'],
      env: flags.env,
    };

    const descriptor = await getProjectDescriptor(buildOpts.descriptor);

    const functionName = descriptor.com.salesforce.id as string;

    const benny = await getFunctionsBinary();

    const writeMsg = (msg: { text: string; timestamp: string }) => {
      const outputMsg = msg.text;

      if (outputMsg) {
        cli.info(outputMsg);
      }
    };
    benny.on('pack', writeMsg);
    benny.on('container', writeMsg);

    benny.on('error', (msg: { text: string }) => {
      cli.error(msg.text, { exit: false });
    });

    benny.on('log', (msg: { text: string; level: string; fields: JsonMap }) => {
      if (msg.level === 'debug' && !flags.verbose) return;
      if (msg.level === 'error') {
        this.exit();
      }

      if (msg.text) {
        cli.info(msg.text);
      }

      // evergreen:benny:message {"type":"log","timestamp":"2021-05-10T10:00:27.953248-05:00","level":"info","fields":{"debugPort":"9229","localImageName":"jvm-fn-init","network":"","port":"8080"}} +21ms
      if (msg.fields && msg.fields.localImageName) {
        this.log(`${herokuColor.magenta('Running on port')} :${herokuColor.cyan(msg.fields.port as string)}`);
        this.log(
          `${herokuColor.magenta('Debugger running on port')} :${herokuColor.cyan(msg.fields.debugPort as string)}`
        );
      }
    });

    if (!flags['no-build']) {
      this.log(`${herokuColor.magenta('Building')} ${herokuColor.cyan(functionName)}`);
      await benny.build(functionName, buildOpts);
    }

    if (!flags['no-run']) {
      this.log(`${herokuColor.magenta('Starting')} ${herokuColor.cyan(functionName)}`);
      await benny.run(functionName, runOpts);
    }
  }
}
