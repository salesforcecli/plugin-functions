/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import axios from 'axios';
import { cli } from 'cli-ux';
import { Messages } from '@salesforce/core';

import Command from '../../lib/base';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'login.functions');

export default class Login extends Command {
  static summary = messages.getMessage('summary');

  static description = messages.getMessage('description');

  static examples = messages.getMessages('examples');

  async run() {
    const identityUrl = process.env.SALESFORCE_FUNCTIONS_IDENTITY_URL || 'https://cli-auth.heroku.com';

    const { data: body } = await axios.post(`${identityUrl}/sfdx/auth`, {
      description: 'Login from Sfdx CLI',
    });

    const { browser_url, cli_url, token } = body;
    const browserUrl = identityUrl + browser_url;
    const cliUrl = identityUrl + cli_url;

    this.log(`Opening browser to ${browserUrl}\n`);

    await cli.open(browserUrl);

    cli.action.start('Waiting for login');
    const headers = { Authorization: 'Bearer ' + token };
    const response = await axios.get(cliUrl, { headers });

    if (response.data.error) {
      return this.error(`${response.data.error}`);
    }
    cli.action.stop();

    cli.action.start('Saving credentials');

    const bearerToken = response.data.access_token;

    const refreshToken = response.data.refresh_token;

    this.info.tokens.set(Command.TOKEN_BEARER_KEY, { token: bearerToken, url: this.identityUrl.toString() });

    await this.info.write();

    const account = await this.fetchAccount();

    this.info.tokens.update(Command.TOKEN_BEARER_KEY, { user: account.salesforce_username });

    if (refreshToken) {
      this.info.tokens.set(Command.TOKEN_REFRESH_KEY, {
        token: refreshToken,
        url: this.identityUrl.toString(),
        user: account.salesforce_username,
      });
    }

    await this.info.write();

    cli.action.stop();
  }
}
