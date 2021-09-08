/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Flags } from '@oclif/core';
import { dim, cyan } from 'chalk';
import { Messages } from '@salesforce/core';
import Command from '../../lib/base';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'whoami.functions');

const FIELDS = <const>['id', 'email', 'token'];

export type FunctionsInformationKey = typeof FIELDS[number];
export type FunctionsInformation = { [key in FunctionsInformationKey]?: string };

export default class WhoAmI extends Command {
  static description = messages.getMessage('summary');

  static examples = messages.getMessages('examples');

  static flags = {
    'show-token': Flags.boolean({
      description: messages.getMessage('flags.show-token.summary'),
      hidden: true,
    }),
  };

  async run(): Promise<FunctionsInformation> {
    const { flags } = await this.parse(WhoAmI);
    const ret: FunctionsInformation = {};
    const account = await this.fetchAccount();

    this.log(`Hello ${account.name} 👋 \n`);

    if (flags['show-token']) {
      this.log(`Your functions token is: ${cyan(this.auth)}\n`);
      ret.token = this.auth;
    }

    this.log('Here is some information on your functions account:');

    const fields = Object.entries(account).filter(([key]) => FIELDS.includes(key as FunctionsInformationKey));
    const pad = fields.reduce((max, [key]) => (key.length > max ? key.length : max), 0) + 2;
    fields.forEach(([key, val]) => {
      ret[key as FunctionsInformationKey] = val;
      this.log(dim(`  ${(key + ' :').padStart(pad)} ${val}`));
    });
    return ret;
  }
}
