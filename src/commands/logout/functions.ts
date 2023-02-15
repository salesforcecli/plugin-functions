/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { cli } from 'cli-ux';
import { Messages, StateAggregator } from '@salesforce/core';
import Command from '../../lib/base';
import APIClient, { herokuClientApiUrl } from '../../lib/api-client';

interface Session {
  createdAt: string;
  description: string;
  id: string;
  updatedAt: string;
}

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'logout.functions');

export default class Login extends Command {
  static summary = messages.getMessage('summary');

  static examples = messages.getMessages('examples');

  static flags = {};

  async run() {
    const { flags } = await this.parse(Login);

    const stateAggregator = await StateAggregator.getInstance();
    const token = stateAggregator.tokens.get('functions-bearer', true)?.token;

    this.postParseHook(flags);

    cli.action.start(messages.getMessage('action.start'), '...', { stdout: true });

    if (!token) {
      throw new Error('Not authenticated.');
    }

    const client = new APIClient({
      auth: token,
      apiUrl: herokuClientApiUrl(),
    });

    try {
      // get the sesion id
      const { data: session } = await client.get<Session[]>('/oauth/sessions');
      const sessionID = session[0].id;

      // delete the session
      await client.delete<Session>(`/oauth/sessions/${sessionID}`);

      // remove the token from state
      this.stateAggregator.tokens.unset(Command.TOKEN_BEARER_KEY);
      await this.stateAggregator.tokens.write();

      cli.action.stop();
      return 'Logged out';
    } catch (err: any) {
      const error = err as Error;
      if (error.message?.includes('404')) {
        this.error(new Error('Session not found'));
      }
      if (error.message?.includes('401')) {
        this.error(new Error('Invalid credentials'));
      }
      this.error(new Error(error.message));
    }
  }
}
