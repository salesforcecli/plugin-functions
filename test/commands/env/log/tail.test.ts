import {expect, test} from '@oclif/test'
const fs = require('fs')
import {readFileSync} from 'fs'

describe('logs', () => {
  const logSessionURLAddress = '/stream/5634e5b9-f9d4-48de-8c8c-4e368e5d40ff?srv=example'
  const logSessionURLBase = 'https://va.logs.heroku.com'
  const appName = 'foo-app-bar'

  const fakeResponseData = {
    logplex_url: `${logSessionURLBase}${logSessionURLAddress}`,
  }

  test
  .stdout()
  .nock(logSessionURLBase, {}, api =>
    api
    .get(logSessionURLAddress)
    .reply(200, (_uri: any, _requestBody: any) => {
      return fs.createReadStream('test/helpers/logoutput.txt')
    }),
  )
  .nock('https://api.heroku.com', api =>
    api
    .post(`/apps/${appName}/log-sessions`)
    .reply(200, fakeResponseData),
  )
  .command(['env:log:tail', `--environment=${appName}`])
  .it('shows logSessionURL', ctx => {
    const logs = readFileSync('test/helpers/logoutput.txt', 'utf-8')
    expect(ctx.stdout).to.include(logs)
  })

  test
  .stdout()
  .nock(logSessionURLBase, {}, api =>
    api
    .get(logSessionURLAddress)
    .reply(404, {}),
  )
  .nock('https://api.heroku.com', api =>
    api
    .post(`/apps/${appName}/log-sessions`)
    .reply(200, fakeResponseData),
  )
  .command(['env:log:tail', `--environment=${appName}`])
  .catch((error: Error) => expect(error.message).to.equal('Request failed with status code 404'))
  .it('shows 404 error')

  test
  .stdout()
  .nock(logSessionURLBase, {}, api =>
    api
    .get(logSessionURLAddress)
    .reply(403, {}),
  )
  .nock('https://api.heroku.com', api =>
    api
    .post(`/apps/${appName}/log-sessions`)
    .reply(200, fakeResponseData),
  )
  .command(['env:log:tail', `--environment=${appName}`])
  .catch((error: Error) => expect(error.message).to.equal('Request failed with status code 403'))
  .it('shows 403 error')
})
