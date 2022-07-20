/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { cli } from 'cli-ux';
import { Messages } from '@salesforce/core';

import Command from '../../lib/base';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'logout.functions');

export default class Login extends Command {
  static summary = messages.getMessage('summary');

  static examples = messages.getMessages('examples');

  static flags = {};

  async run() {
    const { flags } = await this.parse(Login);
    this.postParseHook(flags);

    cli.action.start(messages.getMessage('action.start'));

    this.stateAggregator.tokens.unset(Command.TOKEN_BEARER_KEY);
    await this.stateAggregator.tokens.write();

    cli.action.stop();

    return 'Logged out';
  }
}
