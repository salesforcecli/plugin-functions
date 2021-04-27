import {expect, test} from '@oclif/test'

describe('sf env:var:set', () => {
  test
  .stdout()
  .stderr()
  // Adding retries here because there is some kind of race condition that causes fancy-test to not
  // fully capture the value of stderr when running in CI (╯°□°)╯︵ ┻━┻
  .retries(2)
  .nock('https://api.heroku.com', api =>
    api
    .patch('/apps/my-environment/config-vars', {
      foo: 'bar',
    })
    .reply(200),
  )
  .command(['env:var:set', 'foo=bar', '--environment', 'my-environment'])
  .it('works with a single variable', ctx => {
    expect(ctx.stderr).to.contain('Setting foo and restarting my-environment')
  })

  test
  .stdout()
  .stderr()
  .nock('https://api.heroku.com', api =>
    api
    .patch('/apps/my-environment/config-vars', {
      foo: 'bar',
      bar: 'baz',
    })
    .reply(200),
  )
  .command(['env:var:set', 'foo=bar', 'bar=baz', '--environment', 'my-environment'])
  .it('works with a multiple variables', ctx => {
    expect(ctx.stderr).to.contain('Setting foo, bar and restarting my-environment')
  })

  test
  .command(['env:var:set', 'foobar', '--environment', 'my-environment'])
  .catch(error => {
    expect(error.message).to.contain('foobar is invalid. Please use the format key=value')
  })
  .it('fails when arguments are not in the correct format')
})
