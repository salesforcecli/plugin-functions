import {expect, test} from '@oclif/test'
import {Config} from '@salesforce/core'
import {MockTestOrgData, testSetup} from '@salesforce/core/lib/testSetup'
import {OutputEvent, RunFunction} from '@salesforce/functions-core'
import * as events from 'events'
import * as sinon from 'sinon'

describe('run:function', () => {
  const $$ = testSetup()
  const targetUrl = 'http://localhost'
  const userpayload = '{"id":654321,"field1":"somefield"}'
  let testData: MockTestOrgData
  let sandbox: sinon.SinonSandbox
  let runFunctionStub: sinon.SinonStub
  let runFunctionOutputStub: sinon.SinonStub
  beforeEach(() => {
    sandbox = sinon.createSandbox()
    runFunctionStub = sandbox.stub(RunFunction.prototype, 'execute')
    runFunctionOutputStub = sandbox.stub(RunFunction.prototype, 'on')
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
      runFunctionStub.returns(true)
      sinon.assert.calledWith(runFunctionStub, {payload: userpayload, url: targetUrl})
    })
    test
    .command(['run:function', '-u', targetUrl, '-p', userpayload, '-H', 'TestHeader', '--structured', '-t', Config.DEFAULT_USERNAME])
    .it('Should call the library with all arguments', async () => {
      runFunctionStub.returns(true)
      sinon.assert.calledWith(runFunctionStub, {payload: userpayload, url: targetUrl, headers: ['TestHeader'], structured: true, targetusername: Config.DEFAULT_USERNAME})
    })
  })
  context('with output', () => {
    process.stderr.isTTY = true
    let emitter: events.EventEmitter
    beforeEach(async () => {
      runFunctionStub.returns(true)
      emitter = new events.EventEmitter()
      runFunctionOutputStub.callsFake((event: OutputEvent | symbol, listener: (...args: any[]) => void) => {
        return emitter.on(event, listener)
      })
    })

    test
    .stdout()
    .command(['run:function', '-u', targetUrl, '-p', userpayload])
    .it('Should log output', async ctx => {
      emitter.emit('log', 'Something happened!')
      expect(ctx.stdout).to.contain('Something happened!')
    })

    test
    .stderr()
    .command(['run:function', '-u', targetUrl, '-p', userpayload])
    .it('Should log warnings', async ctx => {
      emitter.emit('warn', 'Something went wrong!')
      expect(ctx.stderr).to.contain('Warning: Something went wrong!')
    })

    test
    .command(['run:function', '-u', targetUrl, '-p', userpayload])
    .it('Should have all listeners set', () => {
      expect(emitter.eventNames()).to.include.members(['error', 'log', 'warn', 'start_action', 'stop_action', 'debug', 'json'])
    })
  })
})
