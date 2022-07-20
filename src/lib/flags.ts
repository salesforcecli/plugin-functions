/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Flags, Errors, Interfaces } from '@oclif/core';
import { cli } from 'cli-ux';
import { Messages } from '@salesforce/core';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'lib.flags');

export const FunctionsFlagBuilder = {
  environment: Flags.build({
    char: 'e',
    description: messages.getMessage('flags.target-compute.summary'),
    required: false,
  }),

  connectedOrg: Flags.build({
    char: 'o',
    description: messages.getMessage('flags.connectedOrg.summary'),
    required: false,
  }),

  keyValueFlag: Flags.build({
    description: messages.getMessage('flags.keyValueFlag.summary'),
    async parse(input) {
      const [key, ...rest] = input.split('=');
      const value = rest.join('=');

      if (!value) {
        throw new Errors.CLIError(`--${this.name}=${input} must be a valid key-value pair (i.e. mykey=somevalue)`);
      }

      return { key, value };
    },
  }),
};

export const environmentType = Flags.string({
  char: 't',
  description: messages.getMessage('flags.environmentType.summary'),
  options: ['org', 'scratchorg', 'compute'],
  multiple: true,
});

export const confirmationFlag = Flags.string({
  description: messages.getMessage('flags.confirmationFlag.summary'),
  helpValue: 'name',
  multiple: true,
});

export const waitFlag = Flags.boolean({
  char: 'w',
  required: false,
  description: messages.getMessage('flags.waitFlag.summary'),
});

export const FunctionsTableFlags: Interfaces.FlagInput<any> = {
  // only let supertable alternatively
  // output in json & csv for now
  // Cast until cli-us uses oclif/core
  ...(cli.table.flags({ except: ['csv', 'output'] }) as unknown as Interfaces.FlagInput<any>),
  output: Flags.string({
    exclusive: ['no-truncate', 'csv'],
    description: messages.getMessage('flags.FunctionsTableFlags.summary'),
    options: ['json', 'csv'],
  }),
};
