import {expect, test} from '@oclif/test'
import {unstyle} from 'ansi-colors'

describe('sf env:var:set', () => {
  test
  .stdout()
  .stderr()
  .nock('https://api.heroku.com', api =>
    api
    .patch('/apps/my-app/config-vars', {
      foo: 'bar',
    })
    .reply(200),
  )
  .command(['env:var:set', 'foo=bar', '--app', 'my-app'])
  .it('works with a single variable', ctx => {
    expect(ctx.stderr).to.contain('Setting foo and restarting my-app... done\n')
  })

  test
  .stdout()
  .stderr()
  .nock('https://api.heroku.com', api =>
    api
    .patch('/apps/my-app/config-vars', {
      foo: 'bar',
      bar: 'baz',
    })
    .reply(200),
  )
  .command(['env:var:set', 'foo=bar', 'bar=baz', '--app', 'my-app'])
  .it('works with a multiple variables', ctx => {
    expect(ctx.stderr).to.contain('Setting foo, bar and restarting my-app... done\n')
  })

  test
  .command(['env:var:set', 'foobar', '--app', 'my-app'])
  .catch(error => {
    expect(unstyle(error.message)).to.contain('foobar is invalid. Please use the format key=value')
  })
  .it('fails when arguments are not in the correct format')
})
