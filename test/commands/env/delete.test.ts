import {expect, test} from '@oclif/test'
import {Aliases, Org} from '@salesforce/core'
import * as sinon from 'sinon'

const COMPUTE_ENV_NAME = 'my-new-compute-environment-100'
const COMPUTE_ENV_ALIAS = 'my-compute-alias'

describe('env:delete', () => {
  const sandbox = sinon.createSandbox()

  test
  .stderr()
  .nock('https://api.heroku.com', api =>
    api
    .delete(`/apps/${COMPUTE_ENV_NAME}`)
    .reply(200),
  )
  .command(['env:delete', `--environment=${COMPUTE_ENV_NAME}`, `--confirm=${COMPUTE_ENV_NAME}`])
  .it('deletes an environment when providing the name of the compute environment', ctx => {
    const output = ctx.stderr
    expect(output).to.include(`Deleting environment ${COMPUTE_ENV_NAME}... done`)
  })

  test
  .stderr()
  .do(() => {
    sandbox.stub(Aliases, 'create' as any).returns({
      get: () => COMPUTE_ENV_NAME,
    })
  })
  .finally(() => {
    sandbox.restore()
  })
  .nock('https://api.heroku.com', api =>
    api
    .delete(`/apps/${COMPUTE_ENV_NAME}`)
    .reply(200),
  )
  .command(['env:delete', `--environment=${COMPUTE_ENV_ALIAS}`, `--confirm=${COMPUTE_ENV_ALIAS}`])
  .it('deletes an environment when providing the valid alias of a compute environment name', ctx => {
    const output = ctx.stderr
    expect(output).to.include(`Deleting environment ${COMPUTE_ENV_ALIAS}... done`)
  })

  test
  .stderr()
  .nock('https://api.heroku.com', api =>
    api
    .delete(`/apps/${COMPUTE_ENV_NAME}`)
    .reply(404),
  )
  .command(['env:delete', `--environment=${COMPUTE_ENV_NAME}`, `--confirm=${COMPUTE_ENV_NAME}`])
  .catch(error => {
    expect(error.message).to.contain('Value provided for environment does not match a compute environment name or an alias to a compute environment')
  })
  .it('errors when providing an invalid compute environment name or alias', ctx => {
    const output = ctx.stderr
    expect(output).to.include(`Deleting environment ${COMPUTE_ENV_NAME}... failed`)
  })

  test
  .stderr()
  .do(() => {
    sandbox.stub(Org, 'create' as any).returns({name: true})
  })
  .finally(() => {
    sandbox.restore()
  })
  .command(['env:delete', `--environment=${COMPUTE_ENV_NAME}`, `--confirm=${COMPUTE_ENV_NAME}`])
  .catch(error => {
    expect(error.message).to.contain(`The environment ${COMPUTE_ENV_NAME} is a Salesforce org. The env:delete command currently can only be used to delete compute environments. Please use sfdx force:org:delete to delete scratch and sandbox Salesforce org environments.`)
  })
  .it('errors when providing an alias of an org environment', ctx => {
    const output = ctx.stderr
    expect(output).to.include(`Deleting environment ${COMPUTE_ENV_NAME}... failed`)
  })
})