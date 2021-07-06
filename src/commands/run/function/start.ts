/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { Command, flags } from '@oclif/command';
import herokuColor from '@heroku-cli/color';

import { getFunctionsBinary, getProjectDescriptor } from '@heroku/functions-core';
import { cli } from 'cli-ux';

export default class Start extends Command {
  static description = 'build and run function image locally';

  static examples = [
    `
    $ sfdx run:function:start
    $ sfdx run:function:start -e VAR=VALUE
    $ sfdx run:function:start --network host --no-pull --clear-cache --debug-port 9000 --port 5000
`,
  ];

  static flags = {
    builder: flags.string({
      description: 'set custom builder image',
      hidden: true,
    }),
    path: flags.string({
      description: 'path to function dir',
      default: path.resolve('.'),
      hidden: true,
    }),
    port: flags.integer({
      char: 'p',
      description: 'port for running the function',
      default: 8080,
    }),
    'debug-port': flags.integer({
      char: 'd',
      description: 'port for remote debugging',
      default: 9229,
    }),
    'clear-cache': flags.boolean({
      description: 'clear associated cache before executing.',
    }),
    'no-pull': flags.boolean({
      description: 'skip pulling builder image before use',
    }),
    'no-build': flags.boolean({
      description: 'skip building the an image',
      hidden: true,
    }),
    'no-run': flags.boolean({
      description: 'skip running the built image',
      hidden: true,
    }),
    env: flags.string({
      char: 'e',
      description: 'set environment variables (provided during build and run)',
      multiple: true,
    }),
    network: flags.string({
      description:
        'Connect and build containers to a network. This can be useful to build containers which require a local resource.',
    }),
    verbose: flags.boolean({
      char: 'v',
      description: 'output additional logs',
    }),
    descriptor: flags.string({
      description: 'Path to project descriptor file (project.toml) that contains function and/or bulid configuration',
      hidden: true,
    }),
  };

  async run() {
    const { flags } = this.parse(Start);

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

    let descriptor;
    try {
      descriptor = await getProjectDescriptor(buildOpts.descriptor);
    } catch (error) {
      cli.error(error);
    }
    const functionName = descriptor.com.salesforce.id;

    const benny = await getFunctionsBinary();

    const writeMsg = (msg: { text: string; timestamp: string }) => {
      const outputMsg = msg.text;

      if (outputMsg) {
        cli.info(outputMsg);
      }
    };
    benny.on('pack', writeMsg);
    benny.on('container', writeMsg);

    benny.on('error', (msg: any) => {
      cli.error(msg.text, { exit: false });
    });

    benny.on('log', (msg: any) => {
      if (msg.level === 'debug' && !flags.verbose) return;
      if (msg.level === 'error') {
        cli.exit();
      }

      if (msg.text) {
        cli.info(msg.text);
      }

      // evergreen:benny:message {"type":"log","timestamp":"2021-05-10T10:00:27.953248-05:00","level":"info","fields":{"debugPort":"9229","localImageName":"jvm-fn-init","network":"","port":"8080"}} +21ms
      if (msg.fields && msg.fields.localImageName) {
        this.log(`${herokuColor.magenta('Running on port')} :${herokuColor.cyan(msg.fields.port)}`);
        this.log(`${herokuColor.magenta('Debugger running on port')} :${herokuColor.cyan(msg.fields.debugPort)}`);
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
