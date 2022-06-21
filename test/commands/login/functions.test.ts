/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import type { SfTokens } from '@salesforce/core';
import { TokenAccessor } from '@salesforce/core/lib/stateAggregator';
import { cli } from 'cli-ux';
import * as sinon from 'sinon';
import { AuthStubs } from '../../helpers/auth';

describe('sf login functions', () => {
  let windowOpenStub: any;
  let contents: SfTokens;

  beforeEach(() => {
    windowOpenStub = sinon.stub();
    AuthStubs.tokensWrite.callsFake(async function (this: TokenAccessor) {
      contents = this.getAll(true);
      return contents;
    });
  });

  test
    .stdout()
    .stderr()
    .stub(cli, 'open', () => windowOpenStub)
    .nock('https://cli-auth.heroku.com', (api) => {
      api
        .post('/sfdx/auth', { description: 'Login from Sfdx CLI' })
        .reply(200, {
          browser_url: '/browser_url',
          cli_url: '/cli_url',
          token: 'temp-token',
        })
        .get('/cli_url')
        .reply(200, {
          access_token: 'evergreen-id-bearer',
          refresh_token: 'evergreen-id-refresh',
        });
    })
    .nock('https://api.heroku.com', (api) => {
      api.get('/account').reply(200, { salesforce_username: 'username' });
    })
    .command(['login:functions'])
    .it('can save a bearer token from heroku identity service', (ctx) => {
      expect(windowOpenStub.firstCall.args[0]).to.equal('https://cli-auth.heroku.com/browser_url');
      sinon.assert.match(contents, {
        'functions-bearer': {
          token: 'evergreen-id-bearer',
          url: 'https://cli-auth.heroku.com/',
          user: 'username',
        },
        'functions-refresh': {
          token: 'evergreen-id-refresh',
          url: 'https://cli-auth.heroku.com/',
          user: 'username',
        },
      });
    });

  describe('checking against SALESFORCE_FUNCTIONS_IDENTITY_URL set to https://heroku-identity.herokuapp.com', () => {
    const SALESFORCE_FUNCTIONS_IDENTITY_URL = 'https://heroku-identity.herokuapp.com';

    test
      .stdout()
      .stderr()
      .stub(cli, 'open', () => windowOpenStub)
      .nock(SALESFORCE_FUNCTIONS_IDENTITY_URL, (api) => {
        api.post('/sfdx/auth').reply(200, {
          browser_url: '/browser_url',
          cli_url: '/cli_url',
          token: 'temp-token',
        });
      })
      .nock(
        SALESFORCE_FUNCTIONS_IDENTITY_URL,
        {
          reqheaders: {
            authorization: 'Bearer temp-token',
          },
        },
        (api) =>
          api.get('/cli_url').reply(200, {
            access_token: 'evergreen-id-bearer',
            refresh_token: 'evergreen-id-refresh',
          })
      )
      .nock('https://api.heroku.com', (api) => {
        api.get('/account').reply(200, { salesforce_username: 'username' });
      })
      .env({ SALESFORCE_FUNCTIONS_IDENTITY_URL })
      .command(['login:functions'])
      .it('uses the URL from the environment variable', (ctx) => {
        expect(windowOpenStub.firstCall.args[0]).to.equal(SALESFORCE_FUNCTIONS_IDENTITY_URL + '/browser_url');
        sinon.assert.match(contents, {
          'functions-bearer': {
            token: 'evergreen-id-bearer',
            url: 'https://heroku-identity.herokuapp.com/',
            user: 'username',
          },
          'functions-refresh': {
            token: 'evergreen-id-refresh',
            url: 'https://heroku-identity.herokuapp.com/',
            user: 'username',
          },
        });
      });
  });
});
