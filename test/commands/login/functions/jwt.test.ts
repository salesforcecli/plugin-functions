/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import { AuthInfo, GlobalInfo, SfdxProject, SfTokens } from '@salesforce/core';
import * as sinon from 'sinon';
import { AuthStubs } from '../../../helpers/auth';

const PUBLIC_CLIENT_ID = '1e9cdca9-cec7-4dbf-ae84-408694b22bac';

export const PROJECT_CONFIG_MOCK = {
  name: 'sweet_project',
  sfdcLoginUrl: 'project-config-login.com',
};
const PROJECT_MOCK = {
  resolveProjectConfig() {
    return PROJECT_CONFIG_MOCK;
  },
};

describe('sf login functions jwt', () => {
  let contents: SfTokens;

  const SFDX_ACCESS_TOKEN = 'token1234';
  const HEROKU_ACCESS_TOKEN = 'herokutoken';

  beforeEach(() => {
    AuthStubs.write.callsFake(async function (this: GlobalInfo) {
      contents = this.getTokens(true);
      return this.getContents();
    });
  });

  test
    .stdout()
    .stderr()
    .do(() => {
      sinon.stub(AuthInfo, 'create' as any).returns({
        getFields() {
          return {
            accessToken: SFDX_ACCESS_TOKEN,
          };
        },
        save: sinon.stub(),
      });

      sinon.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
    })
    .finally(() => {
      sinon.restore();
    })
    .nock('https://api.heroku.com', (api) => {
      api
        .post('/oauth/tokens', {
          client: {
            id: PUBLIC_CLIENT_ID,
          },
          grant: {
            type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          },
          subject_token: SFDX_ACCESS_TOKEN,
          subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        })
        .reply(201, {
          access_token: {
            token: HEROKU_ACCESS_TOKEN,
          },
        });
      api.get('/account').reply(200, { salesforce_username: 'username' });
    })
    .command(['login:functions:jwt', '--username=foo@bar.com', '--keyfile=keyfile.key', '--clientid=12345'])
    .it('can save a bearer token from heroku identity service', () => {
      sinon.assert.match(contents, {
        'functions-bearer': {
          token: 'herokutoken',
          url: 'https://cli-auth.heroku.com/',
          user: 'username',
        },
      });
    });

  test
    .stdout()
    .stderr()
    .add('AuthInfoCreateStub', () => {
      return sinon.stub(AuthInfo, 'create' as any).returns({
        getFields() {
          return {
            accessToken: SFDX_ACCESS_TOKEN,
          };
        },
        save: sinon.stub(),
      });
    })
    .finally(() => sinon.restore())
    .nock('https://api.heroku.com', (api) => {
      api
        .post('/oauth/tokens', {
          client: {
            id: PUBLIC_CLIENT_ID,
          },
          grant: {
            type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          },
          subject_token: SFDX_ACCESS_TOKEN,
          subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        })
        .reply(201, {
          access_token: {
            token: HEROKU_ACCESS_TOKEN,
          },
        });
      api.get('/account').reply(200, { salesforce_username: 'username' });
    })
    .command([
      'login:functions:jwt',
      '--username=foo@bar.com',
      '--keyfile=keyfile.key',
      '--clientid=12345',
      '--instanceurl=foo.com',
    ])
    .it('will use an instance URL if passed', (ctx) => {
      expect(ctx.AuthInfoCreateStub).to.have.been.calledWithMatch({
        oauth2Options: {
          loginUrl: 'foo.com',
        },
      });
    });

  test
    .stdout()
    .stderr()
    .do(() => {
      sinon.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
    })
    .add('AuthInfoCreateStub', () => {
      return sinon.stub(AuthInfo, 'create' as any).returns({
        getFields() {
          return {
            accessToken: SFDX_ACCESS_TOKEN,
          };
        },
        save: sinon.stub(),
      });
    })
    .finally(() => sinon.restore())
    .nock('https://api.heroku.com', (api) => {
      api
        .post('/oauth/tokens', {
          client: {
            id: PUBLIC_CLIENT_ID,
          },
          grant: {
            type: 'urn:ietf:params:oauth:grant-type:token-exchange',
          },
          subject_token: SFDX_ACCESS_TOKEN,
          subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
        })
        .reply(201, {
          access_token: {
            token: HEROKU_ACCESS_TOKEN,
          },
        });
      api.get('/account').reply(200, { salesforce_username: 'username' });
    })
    .command(['login:functions:jwt', '--username=foo@bar.com', '--keyfile=keyfile.key', '--clientid=12345'])
    .it('will use project config login URL if instanceurl is not passed', (ctx) => {
      expect(ctx.AuthInfoCreateStub).to.have.been.calledWithMatch({
        oauth2Options: {
          loginUrl: PROJECT_CONFIG_MOCK.sfdcLoginUrl,
        },
      });
    });
});
