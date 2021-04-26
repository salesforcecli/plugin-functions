import {expect, test} from '@oclif/test'

describe('sf env:var:unset', () => {
  test
  .stdout()
  .stderr()
  .nock('https://api.heroku.com', api =>
    api
    .patch('/apps/my-environment/config-vars', {
      foo: null,
    })
    .reply(200),
  )
  .command(['env:var:unset', 'foo', '--environment', 'my-environment'])
  .it('works with a single variable', ctx => {
    expect(ctx.stderr).to.contain('Unsetting foo and restarting my-environment')
  })

  test
  .stdout()
  .stderr()
  .nock('https://api.heroku.com', api =>
    api
    .patch('/apps/my-environment/config-vars', {
      foo: null,
      bar: null,
    })
    .reply(200),
  )
  .command(['env:var:unset', 'foo', 'bar', '--environment', 'my-environment'])
  .it('works with a multiple variables', ctx => {
    expect(ctx.stderr).to.contain('Unsetting foo, bar and restarting my-environment')
  })
})
