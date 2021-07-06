/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import { cli } from 'cli-ux';
import * as sinon from 'sinon';

import NetrcMachine from '../../../src/lib/netrc';

describe('sf login functions', () => {
  let windowOpenStub: any;

  beforeEach(() => {
    windowOpenStub = sinon.stub();
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
    .add('setStub', () => sinon.stub(NetrcMachine.prototype, 'set').returns(Promise.resolve(undefined)))
    .command(['login:functions'])
    .finally((ctx) => ctx.setStub.restore())
    .it('can save a bearer token from heroku identity service', (ctx) => {
      expect(windowOpenStub.firstCall.args[0]).to.equal('https://cli-auth.heroku.com/browser_url');
      expect(ctx.setStub.firstCall).to.have.been.calledWith('password', 'evergreen-id-bearer');
      expect(ctx.setStub.secondCall).to.have.been.calledWith('login', 'username');
      expect(ctx.setStub.thirdCall).to.have.been.calledWith('password', 'evergreen-id-refresh');
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
      .add('setStub', () => sinon.stub(NetrcMachine.prototype, 'set').returns(Promise.resolve(undefined)))
      .command(['login:functions'])
      .finally((ctx) => ctx.setStub.restore())
      .it('uses the URL from the environment variable', (ctx) => {
        expect(windowOpenStub.firstCall.args[0]).to.equal(SALESFORCE_FUNCTIONS_IDENTITY_URL + '/browser_url');
        expect(ctx.setStub.firstCall).to.have.been.calledWith('password', 'evergreen-id-bearer');
        expect(ctx.setStub.secondCall).to.have.been.calledWith('login', 'username');
        expect(ctx.setStub.thirdCall).to.have.been.calledWith('password', 'evergreen-id-refresh');
      });
  });
});
