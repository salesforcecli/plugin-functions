/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Messages } from '@salesforce/core';
import { CliUx } from '@oclif/core';
import Command from '../../lib/base';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'logout.functions');

export default class Login extends Command {
  static summary = messages.getMessage('summary');

  static examples = messages.getMessages('examples');

  static flags = {};

  async run() {
    const { flags } = await this.parse(Login);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.postParseHook(flags);

    CliUx.ux.action.start(messages.getMessage('action.start'));

    this.stateAggregator.tokens.unset(Command.TOKEN_BEARER_KEY);
    await this.stateAggregator.tokens.write();

    CliUx.ux.action.stop();

    return 'Logged out';
  }
}
