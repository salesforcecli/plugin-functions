/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { flags } from '@oclif/command';
import { CLIError } from '@oclif/errors';
import { cli } from 'cli-ux';

export const FunctionsFlagBuilder = {
  environment: flags.build({
    char: 'e',
    description: 'environment name',
    required: false,
  }),

  connectedOrg: flags.build({
    char: 'o',
    description: 'username or alias for the org that the compute environment should be connected to',
    required: false,
  }),

  keyValueFlag: flags.build({
    description: 'key-value pair (i.e. mykey=somevalue)',
    parse(input) {
      const [key, ...rest] = input.split('=');
      const value = rest.join('=');

      if (!value) {
        throw new CLIError(`--${this.name}=${input} must be a valid key-value pair (i.e. mykey=somevalue)`);
      }

      return { key, value };
    },
  }),
};

export const environmentType = flags.string({
  char: 't',
  description: 'filter by one or more environment types (org, scratchorg, compute)',
  options: ['org', 'scratchorg', 'compute'],
  multiple: true,
});

export const confirmationFlag = flags.string({
  char: 'c',
  description: 'confirmation name',
  helpValue: 'name',
  multiple: true,
});

export const waitFlag = flags.boolean({
  char: 'w',
  required: false,
  description: 'wait until complete to exit',
});

export const FunctionsTableFlags: flags.Input<any> = {
  // only let supertable alternatively
  // output in json & csv for now
  ...cli.table.flags({ except: ['csv', 'output'] }),
  output: flags.string({
    exclusive: ['no-truncate', 'csv'],
    description: 'output table in a more machine friendly format',
    options: ['json', 'csv'],
  }),
};
