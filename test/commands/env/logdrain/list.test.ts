import {expect, test} from '@oclif/test'
import vacuum from '../../../helpers/vacuum'

const APP_NAME = 'my-app'

const LOG_DRAINS = [
  {
    id: '1',
    url: 'https://logs-r-us.com/1',
  },
  {
    id: '2',
    url: 'https://logs-r-us.com/2',
  },
]

describe('sf env logdrain list', () => {
  test
  .stdout()
  .stderr()
  .nock('https://api.heroku.com', api =>
    api
    .get(`/apps/${APP_NAME}/log-drains`)
    .reply(200, LOG_DRAINS),
  )
  .command(['env:logdrain:list', '-e', APP_NAME])
  .it('shows a list of log drains', ctx => {
    expect(vacuum(ctx.stdout)).to.contain(vacuum(`
    ID URL
    1  https://logs-r-us.com/1
    2  https://logs-r-us.com/2
    `))
  })

  test
  .stdout()
  .stderr()
  .nock('https://api.heroku.com', api =>
    api
    .get(`/apps/${APP_NAME}/log-drains`)
    .reply(200, LOG_DRAINS),
  )
  .command(['env:logdrain:list', '-e', APP_NAME, '--json'])
  .it('shows log drains in JSON when --json is passed', ctx => {
    expect(JSON.parse(ctx.stdout)).to.deep.equal(LOG_DRAINS)
  })
})
