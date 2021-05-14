import {ProjectDescriptor} from '@heroku/project-descriptor'
import {expect, test} from '@oclif/test'
import * as sinon from 'sinon'
import Benny from '../../../../src/benny'
import * as installBenny from '../../../../src/install-benny'

describe('evergreen:function:build', () => {
  let sandbox: sinon.SinonSandbox
  let buildStub: any
  let bennyStub: any

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    bennyStub = sandbox.stub(installBenny, 'updateBenny')
    buildStub = sandbox.stub(Benny.prototype, 'build')
  })
  afterEach(() => {
    sandbox.restore()
  })

  context('with a project.toml and com.salesforce.id', () => {
    beforeEach(() => {
      sandbox.stub(ProjectDescriptor.prototype, 'parseFile').returns(Promise.resolve({com: { salesforce: {id: 'allthethingsfunction'}}}))
    })

    test
      .command(['evergreen:function:build', 'heroku/function:test'])
      .it('should attempt to update benny to the latest version', () => {
        sinon.assert.calledOnce(bennyStub)
      })

    test
      .command(['evergreen:function:build', 'heroku/function:test'])
      .it('should build the image', () => {
        expect(buildStub.calledWith('heroku/function:test')).to.be.true
      })

    test
      .command(['evergreen:function:build', 'heroku/function:test'])
      .it('should build the image with the alias', () => {
        expect(buildStub.calledWith('heroku/function:test')).to.be.true
      })

    test
      .command(['evergreen:function:build', 'heRoKu/service:test'])
      .catch(err => expect(err.message).to.equal('image name heRoKu/service:test must be in all lowercase'))
      .it('should fail for upper case image names')
  })

  context('without an image', () => {
    test
      .command(['evergreen:function:build'])
      .exit(2)
      .it('should exit with an error code')

    test
      .command(['evergreen:function:build'])
      .catch(/image/)
      .it('should mention the missing image')
  })

  context('without a function.toml', () => {
    beforeEach(() => {
      sandbox.stub(ProjectDescriptor.prototype, 'parseFile').rejects(new Error('File Not Found'))
    })

    test
      .command(['evergreen:function:build', 'foo'])
      .exit(2)
      .it('should exit with an error code')

    test
      .command(['evergreen:function:build', 'foo'])
      .catch(/File Not Found/)
      .it('should mention the error')
  })
})
