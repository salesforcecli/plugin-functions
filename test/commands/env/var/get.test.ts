import {expect, test} from '@oclif/test'

describe('sf env:var:get', () => {
  test
  .stdout()
  .stderr()
  .nock('https://api.heroku.com', api =>
    api
    .get('/apps/my-app/config-vars')
    .reply(200, {
      foo: 'bar',
      baz: 'baq',
    }),
  )
  .command(['env:var:get', 'foo', '--app', 'my-app'])
  .it('returns the value of a config var when it exists', ctx => {
    expect(ctx.stdout).to.contain('bar')
  })

  test
  .stdout()
  .stderr()
  .nock('https://api.heroku.com', api =>
    api
    .get('/apps/my-app/config-vars')
    .reply(200, {}),
  )
  .command(['env:var:get', 'foo', '--app', 'my-app'])
  .it('shows a message when the config var is not defined', ctx => {
    expect(ctx.stderr).to.include('No config var named foo found for app my-app')
  })
})
