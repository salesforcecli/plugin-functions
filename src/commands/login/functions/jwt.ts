/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Flags } from '@oclif/core';
import { AuthInfo, AuthRemover, Messages } from '@salesforce/core';
import { getString } from '@salesforce/ts-types';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as Transport from 'jsforce/lib/transport';
import { cli } from 'cli-ux';
import Command from '../../../lib/base';
import { herokuVariant } from '../../../lib/heroku-variant';
import { fetchSfdxProject } from '../../../lib/utils';

// This is a public Oauth client created expressly for the purpose of headless auth in the functions CLI.
// It does not require a client secret, is marked as public in the database and scoped accordingly
const PUBLIC_CLIENT_ID = '1e9cdca9-cec7-4dbf-ae84-408694b22bac';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'login.functions.jwt');

export default class JwtLogin extends Command {
  static summary = messages.getMessage('summary');

  static description = messages.getMessage('description');

  static examples = messages.getMessages('examples');

  static flags = {
    username: Flags.string({
      required: true,
      description: messages.getMessage('flags.username.summary'),
      char: 'u',
    }),
    keyfile: Flags.string({
      required: true,
      char: 'f',
      description: messages.getMessage('flags.keyfile.summary'),
    }),
    clientid: Flags.string({
      required: true,
      char: 'i',
      description: messages.getMessage('flags.clientid.summary'),
    }),
    'instance-url': Flags.string({
      char: 'l',
      description: messages.getMessage('flags.instance-url.summary'),
      exclusive: ['instanceurl'],
    }),
    instanceurl: Flags.string({
      char: 'l',
      description: messages.getMessage('flags.instance-url.summary'),
      exclusive: ['instance-url'],
      hidden: true,
    }),
    alias: Flags.string({
      char: 'a',
      description: messages.getMessage('flags.alias.summary'),
    }),
    'set-default': Flags.boolean({
      char: 'd',
      description: messages.getMessage('flags.set-default.summary'),
    }),
    'set-default-dev-hub': Flags.boolean({
      char: 'v',
      description: messages.getMessage('flags.set-default-dev-hub.summary'),
    }),
  };

  private async initAuthInfo(
    username: string,
    clientId: string,
    keyfile: string,
    loginUrl?: string
  ): Promise<AuthInfo> {
    const oauth2OptionsBase = {
      clientId,
      privateKeyFile: keyfile,
    };

    if (!loginUrl) {
      const project = await fetchSfdxProject();
      // If the user passes an instance URL, we always want to defer that over trying to read their
      // project config or defaulting to the basic salesforce login URL.
      loginUrl = getString(project, 'sfdcLoginUrl', 'https://login.salesforce.com');
    }

    const oauth2Options = {
      ...oauth2OptionsBase,
      loginUrl,
    };

    let authInfo: AuthInfo;
    try {
      authInfo = await AuthInfo.create({
        username,
        oauth2Options,
      });
    } catch (err) {
      const error = err as Error;
      if (error.name === 'AuthInfoOverwriteError') {
        const remover = await AuthRemover.create();
        await remover.removeAuth(username);
        authInfo = await AuthInfo.create({
          username,
          oauth2Options,
        });
      } else {
        this.error(error);
      }
    }
    await authInfo.save();
    return authInfo;
  }

  async run() {
    const { flags } = await this.parse(JwtLogin);
    this.postParseHook(flags);

    const { clientid, username, keyfile } = flags;
    // We support both versions of the flag here for the sake of backward compat
    const instanceUrl = flags['instance-url'] ?? flags.instanceurl;

    if (flags.instanceurl) {
      this.warn(messages.getMessage('flags.instanceurl.deprecation'));
    }

    cli.action.start('Logging in via JWT');

    // Use keyfile, clientid, and username to auth with salesforce via the same workflow
    // as sfdx auth:jwt:grant --json
    const auth = await this.initAuthInfo(username, clientid, keyfile, instanceUrl);

    // Take care of any alias/default setting that needs to happen for the sfdx credential
    // before we move on to the heroku stuff
    if (flags.alias) {
      await auth.setAlias(flags.alias);
    }

    if (flags['set-default']) {
      await auth.setAsDefault({
        org: true,
      });
    }

    if (flags['set-default-dev-hub']) {
      await auth.setAsDefault({
        devHub: true,
      });
    }

    await auth.save();

    // Obtain sfdx access token from Auth info
    const authFields = auth.getFields(true);
    const token = authFields.accessToken;

    // Fire off request to /oauth/tokens on the heroku side with JWT in the payload and
    // obtain heroku access_token. This is configurable so that we can also target staging
    const herokuClientId = process.env.SALESFORCE_FUNCTIONS_PUBLIC_OAUTH_CLIENT_ID ?? PUBLIC_CLIENT_ID;

    let rawResponse;

    try {
      rawResponse = await new Transport().httpRequest({
        method: 'POST',
        url: `${process.env.SALESFORCE_FUNCTIONS_API || 'https://api.heroku.com'}/oauth/tokens`,
        body: JSON.stringify({
          client: {
            id: herokuClientId,
          },
          grant: {
            type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          },
          subject_token: token,
          subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        }),
        headers: { ...herokuVariant('salesforce_sso') },
      });
    } catch (e: any) {
      const error = e as Error;

      if (error.message?.includes('404')) {
        this.error('No functions connection');
      }

      if (error.message?.includes('403')) {
        this.error('User has not been provisioned yet, try $ sf login functions');
      }

      this.error(error);
    }

    const data = JSON.parse(rawResponse.body);
    const bearerToken = data.access_token.token;

    // We have to blow away the auth and API client objects so that they'll fully reinitialize with
    // the new heroku credentials we're about to generate
    this.resetClientAuth();

    this.stateAggregator.tokens.set(Command.TOKEN_BEARER_KEY, {
      token: bearerToken,
      url: this.identityUrl.toString(),
      user: auth.getUsername(),
    });

    await this.stateAggregator.tokens.write();

    cli.action.stop();

    return {
      username: authFields.username,
      sfdxAccessToken: token,
      functionsAccessToken: bearerToken,
      instanceUrl: authFields.instanceUrl,
      orgId: authFields.orgId,
      privateKey: authFields.privateKey,
    };
  }
}
