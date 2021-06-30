/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Flags, Errors, Interfaces } from '@oclif/core';
import { cli } from 'cli-ux';

export const FunctionsFlagBuilder = {
  environment: Flags.build({
    char: 'e',
    description: 'environment name',
    required: false,
  }),

  connectedOrg: Flags.build({
    char: 'o',
    description: 'username or alias for the org that the compute environment should be connected to',
    required: false,
  }),

  keyValueFlag: Flags.build({
    description: 'key-value pair (i.e. mykey=somevalue)',
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
  description: 'filter by one or more environment types (org, scratchorg, compute)',
  options: ['org', 'scratchorg', 'compute'],
  multiple: true,
});

export const confirmationFlag = Flags.string({
  char: 'c',
  description: 'confirmation name',
  helpValue: 'name',
  multiple: true,
});

export const waitFlag = Flags.boolean({
  char: 'w',
  required: false,
  description: 'wait until complete to exit',
});

export const FunctionsTableFlags: Interfaces.FlagInput<any> = {
  // only let supertable alternatively
  // output in json & csv for now
  // Cast until cli-us uses oclif/core
  ...(cli.table.flags({ except: ['csv', 'output'] }) as unknown as Interfaces.FlagInput<any>),
  output: Flags.string({
    exclusive: ['no-truncate', 'csv'],
    description: 'output table in a more machine friendly format',
    options: ['json', 'csv'],
  }),
};
