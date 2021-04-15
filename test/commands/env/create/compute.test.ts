import {expect, test} from '@oclif/test'
import * as sinon from 'sinon'
import {Org, SfdxProject, Aliases} from '@salesforce/core'

const APP_MOCK = {
  id: '1',
  name: 'sweet-project-1',
}

const USERNAME = 'fakeusername@salesforce.com'

const ORG_MOCK = {
  id: '1',
  getOrgId() {
    return '1'
  },
  getUsername() {
    return USERNAME
  },
}

const PROJECT_CONFIG_MOCK = {
  name: 'sweet_project',
}

const PROJECT_MOCK = {
  resolveProjectConfig() {
    return PROJECT_CONFIG_MOCK
  },
}

const PROJECT_MOCK_NO_NAME = {
  resolveProjectConfig() {
    return {}
  },
}

const ORG_ALIAS = 'my-cool-alias'
const ENVIRONMENT_ALIAS = 'my-cool-environment'

describe('sf env create compute', () => {
  const sandbox = sinon.createSandbox()

  test
  .stdout()
  .stderr()
  .retries(3)
  .do(() => {
    sandbox.stub(Org, 'create' as any).returns(ORG_MOCK)
    sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK)
  })
  .finally(() => {
    sandbox.restore()
  })
  .nock('https://api.heroku.com', api => {
    api
    .post(`/sales-org-connections/${ORG_MOCK.id}/apps`, {
      sfdx_project_name: PROJECT_CONFIG_MOCK.name,
    })
    .reply(200, APP_MOCK)
  })
  .command(['env:create:compute'])
  .it('creates a compute environment using the default org and project when no flags are passed', ctx => {
    expect(ctx.stderr).to.contain(`Creating compute environment for org ID ${ORG_MOCK.id}`)
    expect(ctx.stdout).to.contain(`New compute environment created with ID ${APP_MOCK.name}`)
    expect(ctx.stdout).to.contain('Your compute environment is ready')
  })

  let orgStub: any

  const aliasSetSpy = sandbox.spy()
  const aliasWriteSpy = sandbox.spy()

  test
  .stdout()
  .stderr()
  .retries(3)
  .do(() => {
    orgStub = sandbox.stub(Org, 'create' as any).returns(ORG_MOCK)
    sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK)
    sandbox.stub(Aliases, 'create' as any).returns({
      set: aliasSetSpy,
      write: aliasWriteSpy,
    })
  })
  .finally(() => {
    sandbox.restore()
  })
  .nock('https://api.heroku.com', api => {
    api
    .post(`/sales-org-connections/${ORG_MOCK.id}/apps`, {
      sfdx_project_name: PROJECT_CONFIG_MOCK.name,
    })
    .reply(200, APP_MOCK)
  })
  .command(['env:create:compute', '-o', `${ORG_ALIAS}`, '-a', `${ENVIRONMENT_ALIAS}`])
  .it('creates a compute environment using and sets an alias using values passed in flags', ctx => {
    expect(ctx.stderr).to.contain(`Creating compute environment for org ID ${ORG_MOCK.id}`)
    expect(ctx.stdout).to.contain(`New compute environment created with ID ${APP_MOCK.name}`)
    expect(ctx.stdout).to.contain(`Your compute environment with local alias ${ENVIRONMENT_ALIAS} is ready`)
    expect(orgStub).to.have.been.calledWith({aliasOrUsername: ORG_ALIAS})
    expect(aliasSetSpy).to.have.been.calledWith(ENVIRONMENT_ALIAS, APP_MOCK.name)
    expect(aliasWriteSpy).to.have.been.called
  })

  test
  .stdout()
  .stderr()
  .do(() => {
    orgStub = sandbox.stub(Org, 'create' as any).returns(ORG_MOCK)
    sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK_NO_NAME)
  })
  .finally(() => {
    sandbox.restore()
  })
  .command(['env:create:compute'])
  .catch(error => {
    expect(error.message).to.contain('No project name found in sfdx-project.json')
  })
  .it('errors out when project name is not present')

  test
  .stdout()
  .stderr()
  .do(() => {
    orgStub = sandbox.stub(Org, 'create' as any).returns(ORG_MOCK)
    sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK)
  })
  .finally(() => {
    sandbox.restore()
  })
  .nock('https://api.heroku.com', api => {
    api
    .post(`/sales-org-connections/${ORG_MOCK.id}/apps`, {
      sfdx_project_name: PROJECT_CONFIG_MOCK.name,
    })
    .reply(422, {
      message: 'This org is already connected to a compute environment for this project',
    })
    .get(`/sales-org-connections/${ORG_MOCK.id}/apps/${PROJECT_CONFIG_MOCK.name}`)
    .reply(200, APP_MOCK)
  })
  .command(['env:create:compute'])
  .it('displays an informative error message when environment already exists for a given project', ctx => {
    expect(ctx.stderr).to.contain('error!')
    expect(ctx.stdout).to.contain(`Compute Environment ID: ${APP_MOCK.name}`)
  })
})
