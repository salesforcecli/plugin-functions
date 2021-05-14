import * as path from 'path'

import startCommand from '../../../../src/commands/run/function/start'

const testDir = path.resolve(__dirname, '../../../fixtures/square')

describe('build smoke', () => {
  before(() => {
    process.env.DEBUG = '*'
  })
  after(() => {
    delete process.env.DEBUG
  })

  it('should build a node function image', async () => {
    await startCommand.run(['--path', testDir, '--no-run'])
  })
})
