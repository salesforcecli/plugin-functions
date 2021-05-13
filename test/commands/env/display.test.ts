import {expect, test} from '@oclif/test'
import {SfdxProject} from '@salesforce/core'
import * as sinon from 'sinon'
import EnvList from '../../../src/commands/env/list'
import {Aliases, AuthInfo, Org} from '@salesforce/core'
import * as pathUtils from '../../../src/lib/path-utils'
import EnvDisplay from '../../../src/commands/env/display'

export const PROJECT_CONFIG_MOCK = {
  name: 'sweet_project',
}
const PROJECT_MOCK = {
  resolveProjectConfig() {
    return PROJECT_CONFIG_MOCK
  },
}

const AUTH_INFO_FIELDS = {
  devHubUsername: 'fakeUsername',
  orgId: '00D9A0000009Jp8UAE',
  username: 'test-7xygrwb90czo@example.com',
  accessToken: '00D9A0000009Jp8!AR0AQB92DA.H2s…',
  clientId: 'PlatformCLI',
}

const SCRATCH_ORG_MOCK = {
  status: 'Active',
  expirationDate: '2021-05-12',
  createdBy: 'mimen+202103231030@5921856d-20…',
  edition: 'Developer',
  orgName: 'test company',
  createdDate: '2021-05-05T20:25:33.000+0000',
}

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
}

const APP_MOCK = {
  created_at: '2021-05-05T21:57:37Z',
  sales_org_connection: {
    sales_org_id: '00D9A0000009JGUUA2',
  },
}
const ORG_ENV_NAME = 'my-org-env'

const COMPUTE_ENV_NAME = 'my-compute-env'
const COMPUTE_ENV_ALIAS = 'my-compute-alias'

describe('sf env display', () => {
  const sandbox = sinon.createSandbox()

  test
  .stderr()
  .do(() => {
    sandbox.stub(Org, 'create' as any).returns({
      getUsername: () => 'fakeUsername',
    })
    sandbox.stub(AuthInfo, 'create' as any).returns({
      getFields: () => {
        return AUTH_INFO_FIELDS
      },
    })
    sandbox.stub(EnvDisplay.prototype, 'getScratchOrgInformation' as any).returns({})
  })
  .stdout()
  .finally(() => {
    sandbox.restore()
  })
  .command(['env:display', `--environment=${ORG_ENV_NAME}`])
  .it('list org environment details when a non-scratch org environment is provided', ctx => {
    expect(ctx.stdout).not.to.include(SCRATCH_ORG_MOCK.status)
    expect(ctx.stdout).not.to.include(SCRATCH_ORG_MOCK.expirationDate)
    expect(ctx.stdout).to.include(AUTH_INFO_FIELDS.devHubUsername)
    expect(ctx.stdout).to.include(AUTH_INFO_FIELDS.orgId)
    expect(ctx.stdout).to.include(AUTH_INFO_FIELDS.username)
    expect(ctx.stdout).to.include(AUTH_INFO_FIELDS.accessToken)
    expect(ctx.stdout).to.include(AUTH_INFO_FIELDS.clientId)
  })

  test
  .stderr()
  .do(() => {
    sandbox.stub(Org, 'create' as any).returns({
      getUsername: () => 'fakeUsername',
    })
    sandbox.stub(AuthInfo, 'create' as any).returns({
      getFields: () => {
        return AUTH_INFO_FIELDS
      },
    })
    sandbox.stub(EnvDisplay.prototype, 'getScratchOrgInformation' as any).returns(SCRATCH_ORG_MOCK)
  })
  .stdout()
  .finally(() => {
    sandbox.restore()
  })
  .command(['env:display', `--environment=${ORG_ENV_NAME}`])
  .it('list org environment details when a scratch org environment is provided', ctx => {
    expect(ctx.stdout).to.include(SCRATCH_ORG_MOCK.status)
    expect(ctx.stdout).to.include(SCRATCH_ORG_MOCK.expirationDate)
    expect(ctx.stdout).to.include(SCRATCH_ORG_MOCK.createdBy)
    expect(ctx.stdout).to.include(SCRATCH_ORG_MOCK.edition)
    expect(ctx.stdout).to.include(SCRATCH_ORG_MOCK.orgName)
    expect(ctx.stdout).to.include(SCRATCH_ORG_MOCK.createdDate)
    expect(ctx.stdout).to.include(AUTH_INFO_FIELDS.devHubUsername)
  })

  test
  .stderr()
  .nock('https://api.heroku.com', api =>
    api
    .get(`/apps/${COMPUTE_ENV_NAME}`)
    .reply(200, APP_MOCK),
  )
  .stdout()
  .do(() => {
    sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK)
    sandbox.stub(EnvList.prototype, 'resolveOrgs' as any).returns(GROUPED_ORGS_MOCK)
    const error = new Error('No AuthInfo found')
    sandbox.stub(Org, 'create' as any).throws(error)
    sandbox.stub(pathUtils, 'resolveFunctionsPaths' as any).returns(['functions/fn1', 'functions/fn2'])
  })
  .finally(() => {
    sandbox.restore()
  })
  .command(['env:display', `--environment=${COMPUTE_ENV_NAME}`])
  .it('list compute environment details when a compute environment is provided', ctx => {
    expect(ctx.stdout).to.include(COMPUTE_ENV_NAME)
    expect(ctx.stdout).to.include(PROJECT_CONFIG_MOCK.name)
    expect(ctx.stdout).to.include(APP_MOCK.sales_org_connection.sales_org_id)
    expect(ctx.stdout).to.include(APP_MOCK.created_at)
    expect(ctx.stdout).to.include('fn1')
    expect(ctx.stdout).to.include('fn2')
  })

  test
  .stderr()
  .nock('https://api.heroku.com', api =>
    api
    .get(`/apps/${COMPUTE_ENV_NAME}`)
    .reply(200, APP_MOCK),
  )
  .stdout()
  .do(() => {
    sandbox.stub(Aliases, 'create' as any).returns({
      get: () => COMPUTE_ENV_NAME,
    })
    sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK)
    sandbox.stub(EnvList.prototype, 'resolveOrgs' as any).returns(GROUPED_ORGS_MOCK)
    const error = new Error('No AuthInfo found')
    sandbox.stub(Org, 'create' as any).throws(error)
    sandbox.stub(pathUtils, 'resolveFunctionsPaths' as any).returns(['functions/fn1', 'functions/fn2'])
  })
  .finally(() => {
    sandbox.restore()
  })
  .command(['env:display', `--environment=${COMPUTE_ENV_ALIAS}`])
  .it('list compute environment details when a compute environment alias is provided', ctx => {
    expect(ctx.stdout).to.include(COMPUTE_ENV_NAME)
    expect(ctx.stdout).to.include(COMPUTE_ENV_ALIAS)
  })

  test
  .stderr()
  .command(['env:display', '--environment=invalidName'])
  .catch(error => {
    expect(error.message).to.contain('Value provided for environment does not match any environment names or aliases.')
  })
  .it('errors out when an invalid environment name is provided')
})
