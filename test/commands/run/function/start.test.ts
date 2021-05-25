import {ProjectDescriptor} from '@heroku/project-descriptor'
import {expect, test} from '@oclif/test'
import * as events from 'events'
import * as sinon from 'sinon'
import * as installBenny from '../../../../src/install-benny'
import Benny from '../../../../src/benny'

describe('function:start', () => {
  let sandbox: sinon.SinonSandbox
  let bennyStub: any
  let runStub: sinon.SinonStub<[string, {
    port: number | undefined;
    'debug-port': number | undefined;
    env: string[];
  }], Promise<unknown>>
  let buildStub: any
  beforeEach(() => {
    sandbox = sinon.createSandbox()
    buildStub = sandbox.stub(Benny.prototype, 'build')
    runStub = sandbox.stub(Benny.prototype, 'run')
    bennyStub = sandbox.stub(installBenny, 'updateBenny')
  })

  afterEach(() => {
    sandbox.restore()
  })

  context('with a builder name and a project.toml', () => {
    beforeEach(() => {
      sandbox.stub(ProjectDescriptor.prototype, 'parseFile').returns(Promise.resolve({com: {salesforce: {id: 'allthethingsfunction'}}}))
    })

    test
    .command(['run:function:start', '--builder=heroku/function:test'])
    .it('should call the run command correctly', () => {
      sinon.assert.calledOnce(runStub)
    })

    test
    .command(['run:function:start', '--builder=heroku/function:test'])
    .it('should call the build command correctly', () => { // WIP
      expect(buildStub.calledWith(sinon.match.string, sinon.match.has('builder', 'heroku/function:test'))).to.be.true
    })

    test
    .command(['run:function:start', '--builder=heroku/function:test'])
    .it('should attempt to update benny to the latest version', () => {
      sinon.assert.calledOnce(bennyStub)
    })
  })

  context('with a network name', () => {
    beforeEach(() => {
      sandbox.stub(ProjectDescriptor.prototype, 'parseFile').returns(Promise.resolve({com: {salesforce: {id: 'allthethingsfunction'}}}))
    })

    test
    .command(['run:function:start', '--network=host'])
    .it('should call the build command correctly', () => {
      sinon.assert.calledOnce(runStub)
    })

    test
    .command(['run:function:start', '--network=host'])
    .it('should call the run command correctly', () => {
      expect(buildStub.calledWith(sinon.match.any, sinon.match.has('network', 'host'))).to.be.true
    })

    test
    .command(['run:function:start', '--network=host'])
    .it('should attempt to update benny to the latest version', () => {
      sinon.assert.calledOnce(bennyStub)
    })
  })

  context('with env set', () => {
    beforeEach(() => {
      sandbox.stub(ProjectDescriptor.prototype, 'parseFile').returns(Promise.resolve({com: {salesforce: {id: 'allthethingsfunction'}}}))
    })

    test
    .command(['run:function:start', '-eVAL=1'])
    .it('should call benny correctly with env', () => {
      expect(runStub.calledWith(sinon.match.string, sinon.match.has('env', ['VAL=1']))).to.be.true
    })
  })

  context('with a bunch of flags', () => {
    beforeEach(() => {
      sandbox.stub(ProjectDescriptor.prototype, 'parseFile').returns(Promise.resolve({com: {salesforce: {id: 'allthethingsfunction'}}}))
    })

    test
    .command(['run:function:start', '--clear-cache', '--no-pull', '--port=5000', '--debug-port=5001'])
    .it('should call the run command correctly', () => {
      sinon.assert.calledWith(buildStub, sinon.match.string, sinon.match({
        'clear-cache': true,
        'no-pull': true,
      }))
      sinon.assert.calledWith(runStub, sinon.match.string, sinon.match({
        'debug-port': 5001,
        port: 5000,
      }))
    })

    test
    .command(['run:function:start', '-eVAL=1'])
    .it('should attempt to update benny to the latest version', () => {
      sinon.assert.calledOnce(bennyStub)
    })
  })

  context('without a project.toml', () => {
    beforeEach(() => {
      sandbox.stub(ProjectDescriptor.prototype, 'parseFile').rejects(new Error('File Not Found'))
    })

    test
    .command(['run:function:start', '--builder=heroku/function:test'])
    .exit(2)
    .it('should exit with an error code')

    test
    .command(['run:function:start', '--builder=heroku/function:test'])
    .catch(/File Not Found/)
    .it('should mention the error')
  })

  context('output', () => {
    let emitter: events.EventEmitter
    beforeEach(() => {
      emitter = new events.EventEmitter()
      const emitterStub = sandbox.stub(Benny.prototype, 'getEmitter' as any)
      emitterStub.returns(emitter)
      sandbox.stub(ProjectDescriptor.prototype, 'parseFile').returns(Promise.resolve({com: {salesforce: {id: 'allthethingsfunction'}}}))
    })

    test
    .stdout()
    .command(['run:function:start'])
    .it('should attempt to update benny to the latest version', () => {
      sinon.assert.calledOnce(bennyStub)
    })

    test
    .stderr()
    .stub(process, 'exit', () => '')
    .command(['run:function:start'])
    .it('should exit with failure', ctx => {
      emitter.emit('error', {
        text: 'fail!',
      })
      expect(ctx.stderr).to.contain('Error: fail!')
    })
  })
})
