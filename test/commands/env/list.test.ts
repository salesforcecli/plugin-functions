import {expect, test} from '@oclif/test'
import {SfdxProject} from '@salesforce/core'
import * as sinon from 'sinon'
import EnvList from '../../../src/commands/env/list'

export const PROJECT_CONFIG_MOCK = {
  name: 'sweet_project',
}
const PROJECT_MOCK = {
  resolveProjectConfig() {
    return PROJECT_CONFIG_MOCK
  },
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

const HEROKU_ACCOUNT_MOCK = {
  salesforce_org: {
    owner: {
      id: '1234',
    },
  },
}

const ENVIRONMENT_MOCKS = [
  {
    id: '1',
    name: 'sweet-project-1',
    sfdx_project_name: PROJECT_CONFIG_MOCK.name,
    sales_org_connection: {
      sales_org_id: GROUPED_ORGS_MOCK.nonScratchOrgs[0].orgId,
    },
  },
  {
    id: '2',
    name: '12345678',
    sfdx_project_name: 'some_other_project',
    sales_org_connection: {
      sales_org_id: 'nope',
    },
  },
]

const EXPECTED_JSON_OUTPUT = {
  org: [
    {
      alias: '',
      username: 'foo@test.com',
      orgId: '1',
      connectedStatus: 'Connected',
    },
    {
      alias: '',
      username: 'bar@test.com',
      orgId: '2',
      connectedStatus: 'Connected',
    },
    {
      alias: '',
      username: 'baz@test.com',
      orgId: '3',
      connectedStatus: 'Connected',
    },
  ],
  scratchorg: [
    {
      alias: 'my-scratch-org',
      username: 'test-if5m9vhwk3av@example.com',
      orgId: '4',
      connectedStatus: 'Unknown',
      expirationDate: '2021-04-12',
    },
  ],
  compute: [
    {
      alias: '',
      projectName: 'sweet_project',
      connectedOrgAlias: '',
      connectedOrgId: '1',
      name: 'sweet-project-1',
    },
  ],
}

describe('sf env list', () => {
  const sandbox = sinon.createSandbox()

  test
  .stderr()
  .stdout()
  .do(() => {
    sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK)
    sandbox.stub(EnvList.prototype, 'resolveOrgs' as any).returns(GROUPED_ORGS_MOCK)
  })
  .finally(() => {
    sandbox.restore()
  })
  .nock('https://api.heroku.com', api => {
    api
    .get('/account')
    .reply(200, HEROKU_ACCOUNT_MOCK)
    .get(`/enterprise-accounts/${HEROKU_ACCOUNT_MOCK.salesforce_org.owner.id}/apps`)
    .reply(200, ENVIRONMENT_MOCKS)
  })
  .command(['env:list'])
  .it('lists all types of current environments when called with no flags', ctx => {
    expect(ctx.stdout).to.include('Type: Salesforce Org')
    expect(ctx.stdout).to.include('Type: Scratch Org')
    expect(ctx.stdout).to.include('Type: Compute Environment')
    // This assertion is verifying that the default behavior is to only show compute environments
    // associated with your projects
    expect(ctx.stdout).to.not.include('12345678')
  })

  test
  .stderr()
  .stdout()
  .do(() => {
    sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK)
    sandbox.stub(EnvList.prototype, 'resolveOrgs' as any).returns(GROUPED_ORGS_MOCK)
  })
  .finally(() => {
    sandbox.restore()
  })
  .nock('https://api.heroku.com', api => {
    api
    .get('/account')
    .reply(200, HEROKU_ACCOUNT_MOCK)
    .get(`/enterprise-accounts/${HEROKU_ACCOUNT_MOCK.salesforce_org.owner.id}/apps`)
    .reply(200, ENVIRONMENT_MOCKS)
  })
  .command(['env:list', '--json'])
  .it('returns JSON when the JSON flag is used', ctx => {
    const jsonOutput = JSON.parse(ctx.stdout)
    expect(jsonOutput).to.deep.equal(EXPECTED_JSON_OUTPUT)
  })

  test
  .stderr()
  .stdout()
  .do(() => {
    sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK)
    sandbox.stub(EnvList.prototype, 'resolveOrgs' as any).returns(GROUPED_ORGS_MOCK)
  })
  .finally(() => {
    sandbox.restore()
  })
  .nock('https://api.heroku.com', api => {
    api
    .get('/account')
    .reply(200, HEROKU_ACCOUNT_MOCK)
    .get(`/enterprise-accounts/${HEROKU_ACCOUNT_MOCK.salesforce_org.owner.id}/apps`)
    .reply(200, ENVIRONMENT_MOCKS)
  })
  .command(['env:list', '--all'])
  .it('the --all flag shows environments that are not related to your project', ctx => {
    expect(ctx.stdout).to.include('Type: Salesforce Org')
    expect(ctx.stdout).to.include('Type: Scratch Org')
    expect(ctx.stdout).to.include('Type: Compute Environment')
    expect(ctx.stdout).to.include('12345678')
  })

  test
  .stderr()
  .stdout()
  .do(() => {
    sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK)
    sandbox.stub(EnvList.prototype, 'resolveOrgs' as any).returns(GROUPED_ORGS_MOCK)
  })
  .finally(() => {
    sandbox.restore()
  })
  .nock('https://api.heroku.com', api => {
    api
    .get('/account')
    .reply(200, HEROKU_ACCOUNT_MOCK)
    .get(`/enterprise-accounts/${HEROKU_ACCOUNT_MOCK.salesforce_org.owner.id}/apps`)
    .reply(200, ENVIRONMENT_MOCKS)
  })
  .command(['env:list', '-t', 'compute'])
  .it('the --environment-type actually filters based on environment type', ctx => {
    expect(ctx.stdout).to.not.include('Type: Salesforce Org')
    expect(ctx.stdout).to.not.include('Type: Scratch Org')
    expect(ctx.stdout).to.include('Type: Compute Environment')
  })
})
