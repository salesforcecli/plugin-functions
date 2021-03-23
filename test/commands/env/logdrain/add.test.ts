import {expect, test} from '@oclif/test'

const APP_NAME = 'my-app'

const LOG_DRAIN = {
  id: '1',
  url: 'https://logs-r-us.com/1',
}

describe('sf env logdrain add', () => {
  test
  .stdout()
  .stderr()
  .nock('https://api.heroku.com', api =>
    api
    .post(`/apps/${APP_NAME}/log-drains`)
    .reply(200, LOG_DRAIN),
  )
  .command(['env:logdrain:add', '-e', APP_NAME, '-u', LOG_DRAIN.url])
  .it('creates a log drain', ctx => {
    expect(ctx.stderr).to.contain(`Creating drain for environment ${APP_NAME}`)
  })
})
