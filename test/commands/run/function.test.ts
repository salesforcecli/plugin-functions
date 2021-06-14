import {expect, test} from '@oclif/test'
import {Config} from '@salesforce/core'
import {MockTestOrgData, testSetup} from '@salesforce/core/lib/testSetup'
import * as sinon from 'sinon'

import * as library from '@salesforce/functions-core'

describe('run:function', () => {
  const $$ = testSetup()
  const targetUrl = 'http://localhost'
  const userpayload = '{"id":654321,"field1":"somefield"}'
  let testData: MockTestOrgData
  let sandbox: sinon.SinonSandbox
  let runFunctionStub: sinon.SinonStub
  beforeEach(() => {
    sandbox = sinon.createSandbox()
    runFunctionStub = sandbox.stub(library, 'runFunction')
    runFunctionStub.returns({headers: {'content-type': 'application/json; charset=utf-8'},  data: 'Something happened!'})
  })

  afterEach(() => {
    sandbox.restore()
  })

  context('without a url', () => {
    test
    .command(['run:function'])
    .exit(2)
    .it('should exit with an error code')

    test
    .command(['run:function'])
    .catch(/url/)
    .it('should mention the missing argument')
  })

  context('without payload', () => {
    process.stdin.isTTY = true
    test
    .command(['run:function', '-u', targetUrl])
    .catch(/payload/)
    .it('should mention the missing payload')
  })

  context('with payload and other arguments', () => {
    beforeEach(async () => {
      testData = new MockTestOrgData()
      $$.configStubs.AuthInfoConfig = {contents: await testData.getConfig()}
      const config: Config = await Config.create(Config.getDefaultOptions(true))
      await config.set(Config.DEFAULT_USERNAME, testData.username)
      await config.write()
    })

    test
    .command(['run:function', '-u', targetUrl, '-p', userpayload])
    .it(`Should call the library with payload ${userpayload}`, async () => {
      sinon.assert.calledWith(runFunctionStub, {payload: userpayload, url: targetUrl})
    })
    test
    .command(['run:function', '-u', targetUrl, '-p', userpayload, '-H', 'TestHeader', '--structured', '-t', Config.DEFAULT_USERNAME])
    .it('Should call the library with all arguments', async () => {
      sinon.assert.calledWith(runFunctionStub, {payload: userpayload, url: targetUrl, headers: ['TestHeader'], structured: true, targetusername: Config.DEFAULT_USERNAME})
    })
    test
    .stdout()
    .command(['run:function', '-u', targetUrl, '-p', userpayload])
    .it('Should log default username', async ctx => {
      expect(ctx.stdout).to.contain(`Using defaultusername ${testData.username} login credential`)
    })

    test
    .stdout()
    .command(['run:function', '-u', targetUrl, '-p', userpayload])
    .it('Should log response', async ctx => {
      expect(ctx.stdout).to.contain('Something happened!')
    })
  })
  context('without org or defaultuser', () => {
    process.stdout.isTTY = true
    process.stderr.isTTY = true

    test
    .stdout()
    .stderr()
    .command(['run:function', '-u', targetUrl, '-p {"id":12345}'])
    .it('should output the response from the server', ctx => {
      expect(ctx.stdout).to.contain('Something happened!')
      expect(ctx.stderr).to.contain('Warning: No -t targetusername or defaultusername found')
    })
  })
})
