/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as path from 'path';
import { Messages } from '@salesforce/core';
import { Flags } from '@oclif/core';
import Local from './start/local';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'run.function.start');

// run:function:start is an alias to run:function:start:local.
// run:function:start previously ran via container mode, so it accepts
// arguments applicable to the container subcommand, but ignores them and flags
// them as deprecated. The additional flags may be removed after 04/30/2022.
export default class Start extends Local {
  static summary = messages.getMessage('summary');

  static description = messages.getMessage('description');

  static flags = {
    builder: Flags.string({
      description: messages.getMessage('flags.builder.summary'),
      hidden: true,
    }),
    'clear-cache': Flags.boolean({
      description: messages.getMessage('flags.clear-cache.summary'),
      hidden: true,
    }),
    'debug-port': Flags.integer({
      char: 'b',
      description: messages.getMessage('flags.debug-port.summary'),
      default: 9229,
    }),
    descriptor: Flags.string({
      description: messages.getMessage('flags.descriptor.summary'),
      hidden: true,
    }),
    env: Flags.string({
      char: 'e',
      description: messages.getMessage('flags.env.summary'),
      multiple: true,
      hidden: true,
    }),
    language: Flags.enum({
      options: ['javascript', 'typescript', 'java', 'auto'],
      description: messages.getMessage('flags.language.summary'),
      char: 'l',
      default: 'auto',
    }),
    network: Flags.string({
      description: messages.getMessage('flags.network.summary'),
      hidden: true,
    }),
    'no-build': Flags.boolean({
      description: messages.getMessage('flags.no-build.summary'),
      hidden: true,
    }),
    'no-pull': Flags.boolean({
      description: messages.getMessage('flags.no-pull.summary'),
      hidden: true,
    }),
    'no-run': Flags.boolean({
      description: messages.getMessage('flags.no-run.summary'),
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
    verbose: Flags.boolean({
      char: 'v',
      description: messages.getMessage('flags.verbose.summary'),
    }),
  };
}
