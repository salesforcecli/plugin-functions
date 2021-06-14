import {expect, test} from '@oclif/test'
import * as events from 'events'
import * as sinon from 'sinon'

import * as library from '@salesforce/functions-core'
import {Benny} from '@salesforce/functions-core'

describe('function:start', () => {
  let sandbox: sinon.SinonSandbox
  let bennyRunStub: sinon.SinonStub
  let bennyBuildStub: sinon.SinonStub
  beforeEach(() => {
    sandbox = sinon.createSandbox()
    bennyRunStub = sandbox.stub(Benny.prototype, 'run')
    bennyBuildStub = sandbox.stub(Benny.prototype, 'build')
    bennyRunStub.returns(true)
    bennyBuildStub.returns(true)
    sandbox
    .stub(library, 'getProjectDescriptor')
    .returns(Promise.resolve({ com: { salesforce: { id: 'allthethingsfunction' } } }));
  })

  afterEach(() => {
    sandbox.restore()
  })

  test
  .command(['run:function:start'])
  .it('Should call the library methods', async () => {
    sinon.assert.calledOnce(bennyBuildStub)
    sinon.assert.calledOnce(bennyRunStub)
  })

  context('with arguments', () => {
    test
    .command(['run:function:start', '-v', '--no-pull', '--clear-cache'])
    .it('Should call the benny build with flags as arguments', async () => {
      sinon.assert.calledWith(bennyBuildStub,'allthethingsfunction',
        sinon.match.has('no-pull')
        .and(sinon.match.has('clear-cache')))
    })
    test
    .command(['run:function:start', '--debug-port=5001', '--port=5000'])
    .it('Should call the library with custom ports', async () => {
      sinon.assert.calledWith(bennyRunStub, 'allthethingsfunction', sinon.match.has('port', 5000).and(sinon.match.has('debug-port', 5001)))
    })
  })

  context('with output', () => {
    process.stderr.isTTY = true
    let emitter: events.EventEmitter
    beforeEach(async () => {
      emitter = new events.EventEmitter()
      const emitterStub = sandbox.stub(Benny.prototype, 'getEmitter' as any)
      emitterStub.returns(emitter)
    })

    test
    .stdout()
    .command(['run:function:start'])
    .it('Should log output', async ctx => {
      emitter.emit('log', {
        text: 'Something happened!',
      })
      expect(ctx.stdout).to.contain('Something happened!')
    })

    test
    .stderr()
    .stub(process, 'exit', () => '')
    .command(['run:function:start'])
    .it('Should log errors', async ctx => {
      emitter.emit('error', {
        text: 'fail!',
      })
      expect(ctx.stderr).to.contain('Error: fail!')
    })
  })
})
