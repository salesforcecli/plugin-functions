import {expect, test} from '@oclif/test'
import * as events from 'events'
import * as sinon from 'sinon'

import {OutputEvent, StartFunction} from '@salesforce/functions-core'

describe('function:start', () => {
  let sandbox: sinon.SinonSandbox
  let startFunctionStub: sinon.SinonStub
  let startFunctionOutputStub: sinon.SinonStub
  beforeEach(() => {
    sandbox = sinon.createSandbox()
    startFunctionStub = sandbox.stub(StartFunction.prototype, 'execute')
    startFunctionOutputStub = sandbox.stub(StartFunction.prototype, 'on')
    startFunctionStub.returns(true)
  })

  afterEach(() => {
    sandbox.restore()
  })

  test
  .command(['run:function:start'])
  .it('Should call the library', async () => {
    sinon.assert.calledOnce(startFunctionStub)
  })

  context('with arguments', () => {
    test
    .command(['run:function:start', '-v', '--no-pull', '--clear-cache'])
    .it('Should call the library with flags as arguments', async () => {
      sinon.assert.calledWith(startFunctionStub,
        sinon.match.has('verbose')
        .and(sinon.match.has('no-pull'))
        .and(sinon.match.has('clear-cache')))
    })
    test
    .command(['run:function:start', '--debug-port=5001', '--port=5000', '--builder=heroku/function:test'])
    .it('Should call the library with custom port and builder', async () => {
      sinon.assert.calledWith(startFunctionStub, sinon.match({port: 5000, 'debug-port': 5001, builder: 'heroku/function:test'}))
    })
  })

  context('with output', () => {
    process.stderr.isTTY = true
    let emitter: events.EventEmitter
    beforeEach(async () => {
      emitter = new events.EventEmitter()
      startFunctionOutputStub.callsFake((event: OutputEvent | symbol, listener: (...args: any[]) => void) => {
        return emitter.on(event, listener)
      })
    })

    test
    .stdout()
    .command(['run:function:start'])
    .it('Should log output', async ctx => {
      emitter.emit('log', 'Something happened!')
      expect(ctx.stdout).to.contain('Something happened!')
    })

    test
    .stderr()
    .command(['run:function:start'])
    .it('Should log warnings', async ctx => {
      emitter.emit('warn', 'Something went wrong!')
      expect(ctx.stderr).to.contain('Warning: Something went wrong!')
    })

    test
    .command(['run:function:start'])
    .it('Should have all listeners set', () => {
      expect(emitter.eventNames()).to.include.members(['error', 'log', 'warn', 'start_action', 'stop_action', 'debug', 'json'])
    })
  })
})
