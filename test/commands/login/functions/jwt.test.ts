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
import vacuum from '../../../helpers/vacuum';

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

const SFDX_ACCESS_TOKEN = 'token1234';
const HEROKU_ACCESS_TOKEN = 'herokutoken';

const AUTH_INFO_STUB = {
  getFields() {
    return {
      accessToken: SFDX_ACCESS_TOKEN,
    };
  },
  save: sinon.stub(),
  getUsername: sinon.stub().returns('username'),
  setAlias: sinon.stub(),
  setAsDefault: sinon.stub(),
};

describe('sf login functions jwt', () => {
  let contents: SfTokens;

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
      sinon.stub(AuthInfo, 'create' as any).returns(AUTH_INFO_STUB);
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
      return sinon.stub(AuthInfo, 'create' as any).returns(AUTH_INFO_STUB);
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
    })
    .command([
      'login:functions:jwt',
      '--username=foo@bar.com',
      '--keyfile=keyfile.key',
      '--clientid=12345',
      '--instance-url=foo.com',
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
    .add('AuthInfoCreateStub', () => {
      return sinon.stub(AuthInfo, 'create' as any).returns(AUTH_INFO_STUB);
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
    })
    .command([
      'login:functions:jwt',
      '--username=foo@bar.com',
      '--keyfile=keyfile.key',
      '--clientid=12345',
      '--instanceurl=foo.com',
    ])
    .it('will use an instance URL if passed using the old flag (no dash)', (ctx) => {
      expect(vacuum(ctx.stderr).replace(/\n[›»]/gm, '')).to.include(
        vacuum(
          '--instanceurl is deprecated and will be removed in a future release. Please use --instance-url going forward.'
        )
      );
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
      return sinon.stub(AuthInfo, 'create' as any).returns(AUTH_INFO_STUB);
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
    })
    .command(['login:functions:jwt', '--username=foo@bar.com', '--keyfile=keyfile.key', '--clientid=12345'])
    .it('will use project config login URL if instance-url is not passed', (ctx) => {
      expect(ctx.AuthInfoCreateStub).to.have.been.calledWithMatch({
        oauth2Options: {
          loginUrl: PROJECT_CONFIG_MOCK.sfdcLoginUrl,
        },
      });
    });

  test
    .stdout()
    .stderr()
    .do(() => {
      sinon.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sinon.stub(AuthInfo, 'create' as any).returns(AUTH_INFO_STUB);
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
    })
    .command([
      'login:functions:jwt',
      '--username=foo@bar.com',
      '--keyfile=keyfile.key',
      '--clientid=12345',
      '--set-default',
      '--set-default-dev-hub',
      '--alias=my-cool-alias',
    ])
    .it('can set alias and target org / devhub', () => {
      expect(AUTH_INFO_STUB.setAlias).to.have.been.calledWith('my-cool-alias');
      expect(AUTH_INFO_STUB.setAsDefault).to.have.been.calledWith({ org: true });
      expect(AUTH_INFO_STUB.setAsDefault).to.have.been.calledWith({ devHub: true });
    });

  const ORG_INSTANCE_URL = '1234.org.com';
  const PRIVATE_KEY_PATH = 'keyfile.key';
  const USERNAME = '@foo@bar.com';
  const ORG_ID = '1234';

  test
    .stdout()
    .stderr()
    .do(() => {
      sinon.stub(AuthInfo, 'create' as any).returns({
        ...AUTH_INFO_STUB,
        getFields: sinon.stub().returns({
          accessToken: SFDX_ACCESS_TOKEN,
          instanceUrl: ORG_INSTANCE_URL,
          username: USERNAME,
          orgId: ORG_ID,
          privateKey: PRIVATE_KEY_PATH,
        }),
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
    })
    .command([
      'login:functions:jwt',
      `--username=${USERNAME}`,
      `--keyfile=${PRIVATE_KEY_PATH}`,
      '--clientid=12345',
      '--json',
    ])
    .it('returns the correct json payload when --json is used', (ctx) => {
      expect(JSON.parse(ctx.stdout)).to.deep.equal({
        username: USERNAME,
        orgId: ORG_ID,
        sfdxAccessToken: SFDX_ACCESS_TOKEN,
        functionsAccessToken: HEROKU_ACCESS_TOKEN,
        instanceUrl: ORG_INSTANCE_URL,
        privateKey: PRIVATE_KEY_PATH,
      });
    });
});
