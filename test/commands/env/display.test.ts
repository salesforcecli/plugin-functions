/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import { SfdxProject } from '@salesforce/core';
import * as sinon from 'sinon';
import { Aliases, AuthInfo, Org } from '@salesforce/core';
import EnvList from '../../../src/commands/env/list';
import EnvDisplay from '../../../src/commands/env/display';
import * as Utils from '../../../src/lib/utils';

export const PROJECT_CONFIG_MOCK = {
  name: 'sweet_project',
};
const PROJECT_MOCK = {
  resolveProjectConfig() {
    return PROJECT_CONFIG_MOCK;
  },
};

const AUTH_INFO_FIELDS = {
  devHubUsername: 'fakeUsername',
  orgId: '00D9A0000009Jp8UAE',
  username: 'test-7xygrwb90czo@example.com',
  accessToken: '00D9A0000009Jp8!AR0AQB92DA.H2s…',
  clientId: 'PlatformCLI',
};

const SCRATCH_ORG_MOCK = {
  status: 'Active',
  expirationDate: '2021-05-12',
  createdBy: 'mimen+202103231030@5921856d-20…',
  edition: 'Developer',
  orgName: 'test company',
  createdDate: '2021-05-05T20:25:33.000+0000',
};

const GROUPED_ORGS_MOCK = {
  nonScratchOrgs: [
    {
      username: 'foo@test.com',
      orgId: '1',
      isDevHub: true,
      alias: undefined,
      isDefaultUsername: true,
      connectedStatus: 'Connected',
    },
    {
      username: 'bar@test.com',
      orgId: '2',
      isDevHub: false,
      alias: undefined,
      connectedStatus: 'Connected',
    },
    {
      username: 'baz@test.com',
      orgId: '3',
      isDevHub: false,
      alias: undefined,
      connectedStatus: 'Connected',
    },
  ],
  scratchOrgs: [
    {
      username: 'test-if5m9vhwk3av@example.com',
      orgId: '4',
      expirationDate: '2021-04-12',
      alias: 'my-scratch-org',
      devHubOrgId: '00DR0000000IgciMAC',
      orgName: 'chris.freeman company',
      status: 'Active',
      isExpired: false,
      connectedStatus: 'Unknown',
    },
  ],
};

const ORG_ENV_NAME = 'my-org-env';

const COMPUTE_ENV_NAME = 'my-compute-env';
const COMPUTE_ENV_ALIAS = 'my-compute-alias';

const APP_MOCK = {
  id: 'app-id',
  space: {
    id: 'space-id',
  },
  name: COMPUTE_ENV_NAME,
  created_at: '2021-05-05T21:57:37Z',
  sales_org_connection: {
    sales_org_id: '00D9A0000009JGUUA2',
  },
};

const ORG_MOCK = {
  getUsername: () => 'fakeUsername',
  getConnection: () => {
    return {
      metadata: {
        list: () => {
          return [{ fullName: 'functions-fn1' }, { fullName: 'functions-fn2' }];
        },
      },
    };
  },
};

describe('sf env display', () => {
  const sandbox = sinon.createSandbox();

  test
    .stderr()
    .do(() => {
      sandbox.stub(Org, 'create' as any).returns({
        getUsername: () => 'fakeUsername',
      });
      sandbox.stub(AuthInfo, 'create' as any).returns({
        getFields: () => {
          return AUTH_INFO_FIELDS;
        },
      });
      sandbox.stub(EnvDisplay.prototype, 'getScratchOrgInformation' as any).returns({});
    })
    .finally(() => {
      sandbox.restore();
    })
    .stdout()
    .command(['env:display', `--environment=${ORG_ENV_NAME}`])
    .it('list org environment details when a non-scratch org environment is provided', (ctx) => {
      expect(ctx.stdout).not.to.include(SCRATCH_ORG_MOCK.status);
      expect(ctx.stdout).not.to.include(SCRATCH_ORG_MOCK.expirationDate);
      expect(ctx.stdout).to.include(AUTH_INFO_FIELDS.devHubUsername);
      expect(ctx.stdout).to.include(AUTH_INFO_FIELDS.orgId);
      expect(ctx.stdout).to.include(AUTH_INFO_FIELDS.username);
      expect(ctx.stdout).to.include(AUTH_INFO_FIELDS.accessToken);
      expect(ctx.stdout).to.include(AUTH_INFO_FIELDS.clientId);
    });

  test
    .stderr()
    .do(() => {
      sandbox.stub(Org, 'create' as any).returns({
        getUsername: () => 'fakeUsername',
      });
      sandbox.stub(AuthInfo, 'create' as any).returns({
        getFields: () => {
          return AUTH_INFO_FIELDS;
        },
      });
      sandbox.stub(EnvDisplay.prototype, 'getScratchOrgInformation' as any).returns(SCRATCH_ORG_MOCK);
    })
    .finally(() => {
      sandbox.restore();
    })
    .stdout()
    .command(['env:display', `--environment=${ORG_ENV_NAME}`])
    .it('list org environment details when a scratch org environment is provided', (ctx) => {
      expect(ctx.stdout).to.include(SCRATCH_ORG_MOCK.status);
      expect(ctx.stdout).to.include(SCRATCH_ORG_MOCK.expirationDate);
      expect(ctx.stdout).to.include(SCRATCH_ORG_MOCK.createdBy);
      expect(ctx.stdout).to.include(SCRATCH_ORG_MOCK.edition);
      expect(ctx.stdout).to.include(SCRATCH_ORG_MOCK.orgName);
      expect(ctx.stdout).to.include(SCRATCH_ORG_MOCK.createdDate);
      expect(ctx.stdout).to.include(AUTH_INFO_FIELDS.devHubUsername);
    });

  test
    .stderr()
    .nock('https://api.heroku.com', (api) => api.get(`/apps/${COMPUTE_ENV_NAME}`).reply(200, APP_MOCK))
    .stdout()
    .do(() => {
      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(EnvList.prototype, 'resolveOrgs' as any).returns(GROUPED_ORGS_MOCK);
      const error = new Error('No AuthInfo found');
      sandbox
        .stub(Org, 'create' as any)
        .onCall(0)
        .throws(error);
      sandbox.stub(Utils, 'resolveOrg' as any).resolves(ORG_MOCK);
    })
    .finally(() => {
      sandbox.restore();
    })
    .command(['env:display', `--environment=${COMPUTE_ENV_NAME}`])
    .it('list compute environment details when a compute environment is provided', (ctx) => {
      expect(ctx.stdout).to.include(COMPUTE_ENV_NAME);
      expect(ctx.stdout).to.include(PROJECT_CONFIG_MOCK.name);
      expect(ctx.stdout).to.include(APP_MOCK.sales_org_connection.sales_org_id);
      expect(ctx.stdout).to.include(APP_MOCK.created_at);
      expect(ctx.stdout).to.include('fn1');
      expect(ctx.stdout).to.include('fn2');
    });

  test
    .stderr()
    .nock('https://api.heroku.com', (api) => api.get(`/apps/${COMPUTE_ENV_NAME}`).reply(200, APP_MOCK))
    .stdout()
    .do(() => {
      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(EnvList.prototype, 'resolveOrgs' as any).returns(GROUPED_ORGS_MOCK);
      const error = new Error('No AuthInfo found');
      sandbox
        .stub(Org, 'create' as any)
        .onCall(0)
        .throws(error);
      sandbox.stub(Utils, 'resolveOrg' as any).resolves(ORG_MOCK);
    })
    .finally(() => {
      sandbox.restore();
    })
    .command(['env:display', `--environment=${COMPUTE_ENV_NAME}`, '--extended'])
    .it('lists app id and space id when -x flag is passed along with a compute environment', (ctx) => {
      expect(ctx.stdout).to.include('App Id');
      expect(ctx.stdout).to.include('Space Id');
    });

  test
    .stderr()
    .nock('https://api.heroku.com', (api) => api.get(`/apps/${COMPUTE_ENV_NAME}`).reply(200, APP_MOCK))
    .stdout()
    .do(() => {
      sandbox.stub(Aliases, 'create' as any).returns({
        get: () => COMPUTE_ENV_NAME,
      });
      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(EnvList.prototype, 'resolveOrgs' as any).returns(GROUPED_ORGS_MOCK);
      const error = new Error('No AuthInfo found');
      sandbox
        .stub(Org, 'create' as any)
        .onCall(0)
        .throws(error);
      sandbox.stub(Utils, 'resolveOrg' as any).resolves(ORG_MOCK);
    })
    .finally(() => {
      sandbox.restore();
    })
    .command(['env:display', `--environment=${COMPUTE_ENV_ALIAS}`])
    .it('list compute environment details when a compute environment alias is provided', (ctx) => {
      expect(ctx.stdout).to.include(COMPUTE_ENV_NAME);
      expect(ctx.stdout).to.include(COMPUTE_ENV_ALIAS);
    });

  test
    .stderr()
    .command(['env:display', '--environment=invalidName'])
    .catch((error) => {
      expect(error.message).to.contain(
        'Value provided for environment does not match any environment names or aliases.'
      );
    })
    .it('errors out when an invalid environment name is provided');

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => api.get(`/apps/${COMPUTE_ENV_NAME}`).reply(200, APP_MOCK))
    .do(() => {
      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(EnvList.prototype, 'resolveOrgs' as any).returns(GROUPED_ORGS_MOCK);
      const error = new Error('No AuthInfo found');
      sandbox
        .stub(Org, 'create' as any)
        .onCall(0)
        .throws(error);
      sandbox.stub(Utils, 'resolveOrg' as any).resolves(ORG_MOCK);
    })
    .finally(() => {
      sandbox.restore();
    })
    .command(['env:display', `--environment=${COMPUTE_ENV_NAME}`, '--json'])
    .it('outputs JSON when the --json flag is used', (ctx) => {
      expect(JSON.parse(ctx.stdout)).to.deep.equal({
        connectedOrgs: '00D9A0000009JGUUA2',
        createdDate: '2021-05-05T21:57:37Z',
        environmentName: 'my-compute-env',
        project: 'sweet_project',
        functions: ['fn1', 'fn2'],
      });
    });
});
