/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import type { SfTokens } from '@salesforce/core';
import { TokenAccessor } from '@salesforce/core/lib/stateAggregator';
import * as sinon from 'sinon';
import { AuthStubs } from '../../helpers/auth';
import vacuum from '../../helpers/vacuum';

describe('sf logout functions', () => {
  let contents: SfTokens;
  const SESSION_ID = '0e725201-12jr-33lf-9k8h-aaaaa00000';
  const SESSION_MOCK = [
    {
      created_at: '2023-02-15T02:07:53Z',
      description: 'Session @ 165.225.58.14',
      expires_in: 28786,
      id: '0e725201-12jr-33lf-9k8h-aaaaa00000',
      updated_at: '2023-02-15T02:07:53Z',
    },
  ];
  const DELETED_MOCK = {
    created_at: '2023-02-14T16:48:29Z',
    description: 'Session @ 165.225.58.14',
    expires_in: 28478,
    id: '0e725201-12jr-33lf-9k8h-aaaaa00000',
    updated_at: '2023-02-14T16:48:29Z',
  };
  const NOSESSION_MOCK = {
    resource: 'session',
    id: 'not_found',
    message: "Couldn't find that session.",
  };

  beforeEach(() => {
    AuthStubs.tokensWrite.callsFake(async function (this: TokenAccessor) {
      contents = this.getAll(true);
      return contents;
    });
  });

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => {
      api
        .get('/oauth/sessions')
        .reply(200, SESSION_MOCK)
        .delete(`/oauth/sessions/${SESSION_ID}`)
        .reply(200, DELETED_MOCK);
    })
    .command(['logout:functions'])
    .it('Should delete the current session', (ctx) => {
      expect(ctx.stdout).to.include('Logging out of Salesforce Functions... done');
    });

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => {
      api
        .get('/oauth/sessions')
        .reply(200, SESSION_MOCK)
        .delete(`/oauth/sessions/${SESSION_ID}`)
        .reply(200, DELETED_MOCK);
    })
    .command(['logout:functions'])
    .it('Should remove the functions key from the tokens field on logout', (ctx) => {
      sinon.assert.match(contents, {});
    });

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => {
      api.get('/oauth/sessions').reply(401);
    })
    .command(['logout:functions'])
    .catch((error: Error) => expect(error.message).to.equal('Invalid credentials'))
    .it('Should show error if token is not found');

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => {
      api
        .get('/oauth/sessions')
        .reply(200, SESSION_MOCK)
        .delete(`/oauth/sessions/${SESSION_ID}`)
        .reply(404, NOSESSION_MOCK);
    })
    .command(['logout:functions'])
    .catch((error: Error) => expect(error.message).to.equal('Session not found'))
    .it('Should show error if session is not found');

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => {
      api
        .get('/oauth/sessions')
        .reply(200, SESSION_MOCK)
        .delete(`/oauth/sessions/${SESSION_ID}`)
        .reply(404, NOSESSION_MOCK);
    })
    .command(['logout:functions'])
    .catch((error: Error) => expect(error.message).to.equal('Session not found'))
    .it('Should not delete tokens if api call to DELETE endpoint fails', (ctx) => {
      sinon.assert.match(contents, {
        'functions-refresh': {
          token: 'evergreen-id-refresh',
          url: 'https://heroku-identity.herokuapp.com/',
          user: 'username',
        },
      });
    });

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => {
      api
        .get('/oauth/sessions')
        .reply(200, SESSION_MOCK)
        .delete(`/oauth/sessions/${SESSION_ID}`)
        .reply(200, DELETED_MOCK);
    })
    .command(['logout:functions', '--json'])
    .it('Should show json output', (ctx) => {
      expect(vacuum(ctx.stdout).replace(/\n[›»]/gm, '')).to.contain(
        vacuum('{\n"status": 0,\n"result": "Logged out",\n"warnings": []\n}')
      );
    });
});
