/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Flags } from '@oclif/core';
import { AuthInfo, AuthRemover, SfdxError } from '@salesforce/core';
import { getString } from '@salesforce/ts-types';
import { cli } from 'cli-ux';
import Command from '../../../lib/base';
import { herokuVariant } from '../../../lib/heroku-variant';

// This is a public Oauth client created expressly for the purpose of headless auth in the functions CLI.
// It does not require a client secret, is marked as public in the database and scoped accordingly
const PUBLIC_CLIENT_ID = '1e9cdca9-cec7-4dbf-ae84-408694b22bac';

interface OAuthToken {
  authorization: {
    id: string;
    scope: ['evergreen'];
  };
  access_token: {
    expires_in: number;
    id: string;
    token: string;
  };
  user: {
    id: string;
  };
}

export default class JwtLogin extends Command {
  static description = 'login using JWT instead of default web-based flow';

  static examples = [
    '$ sfdx login:functions:jwt --username testuser@mycompany.org --keyfile file.key --clientid 123456',
  ];

  static flags = {
    username: Flags.string({
      required: true,
      description: 'authentication username',
      char: 'u',
    }),
    keyfile: Flags.string({
      required: true,
      char: 'f',
      description: 'path to JWT keyfile',
    }),
    clientid: Flags.string({
      required: true,
      char: 'i',
      description: 'OAuth client ID',
    }),
  };

  private async initAuthInfo(username: string, clientId: string, keyfile: string): Promise<AuthInfo> {
    const project = await this.fetchSfdxProject();
    const oauth2OptionsBase = {
      clientId,
      privateKeyFile: keyfile,
    };
    const loginUrl = getString(project, 'sfdcLoginUrl', 'https://login.salesforce.com');

    const oauth2Options = loginUrl ? Object.assign(oauth2OptionsBase, { loginUrl }) : oauth2OptionsBase;

    let authInfo: AuthInfo;
    try {
      authInfo = await AuthInfo.create({
        username,
        oauth2Options,
      });
    } catch (error) {
      const err = error as SfdxError;
      if (err.name === 'AuthInfoOverwriteError') {
        const remover = await AuthRemover.create();
        await remover.removeAuth(username);
        authInfo = await AuthInfo.create({
          username,
          oauth2Options,
        });
      } else {
        throw err;
      }
    }
    await authInfo.save();
    return authInfo;
  }

  async run() {
    const {
      flags: { clientid, username, keyfile },
    } = await this.parse(JwtLogin);

    cli.action.start('Logging in via JWT');

    // Use keyfile, clientid, and username to auth with salesforce via the same workflow
    // as sfdx auth:jwt:grant --json
    const auth = await this.initAuthInfo(username, clientid, keyfile);

    // Obtain sfdx access toekn from Auth info
    const token = auth.getFields(true).accessToken;

    // Fire off request to /oauth/tokens on the heroku side with JWT in the payload and
    // obtain heroku access_token. This is configurable so that we can also target staging
    const herokuClientId = process.env.SALESFORCE_FUNCTIONS_PUBLIC_OAUTH_CLIENT_ID ?? PUBLIC_CLIENT_ID;

    const response = await this.client.post<OAuthToken>('/oauth/tokens', {
      data: {
        client: {
          id: herokuClientId,
        },
        grant: {
          type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        },
        subject_token: token,
        subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      },
      headers: { ...herokuVariant('salesforce_sso') },
    });

    const bearerToken = response.data.access_token.token;

    // We have to blow away the auth and API client objects so that they'll fully reinitialize with
    // the new heroku credentials we're about to generate
    this.resetClientAuth();

    this.info.setToken(Command.TOKEN_BEARER_KEY, { token: bearerToken, url: this.identityUrl.toString() });

    const account = await this.fetchAccount();

    this.info.updateToken(Command.TOKEN_BEARER_KEY, { user: account.salesforce_username });

    await this.info.write();

    cli.action.stop();
  }
}
