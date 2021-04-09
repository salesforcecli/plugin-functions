import {expect, test} from '@oclif/test'
import * as sinon from 'sinon'

import NetrcMachine from '../../../src/lib/netrc'

describe('sf logout functions', () => {
  test
  .stdout()
  .stderr()
  .add('deleteSpy', () => sinon.spy(NetrcMachine.prototype, 'delete'))
  .command(['logout:functions'])
  .finally(ctx => ctx.deleteSpy.restore())
  .it('deletes both machine entries in netrc', ctx => {
    expect(ctx.deleteSpy).to.have.been.calledTwice
    expect(ctx.stdout).to.contain('Logged out successfully')
  })
})
