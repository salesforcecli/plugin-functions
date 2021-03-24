import {expect, test} from '@oclif/test'
// import * as sinon from 'sinon'

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
  .nock(logSessionURLBase, {}, api => api
  .get(logSessionURLAddress)
  .reply(200, (_uri: any, _requestBody: any) => {
    return fs.createReadStream('test/helpers/logoutput.txt')
  }),
  )
  .nock('https://api.heroku.com', api =>
    api
    .post(`/apps/${appName}/log-sessions`, matches({body: {
      dyno: 'web.2',
      source: 'app',
      tail: true,
    },
    }))
    .reply(200, fakeResponseData),
  )
  .command(['env:log:get', '--space=production', '--app=functions', '--function=functionName'])
  .it('shows logSessionURL', ctx => {
    const logs = readFileSync('test/helpers/logoutput.txt', 'utf-8')
    expect(ctx.stdout).to.include(logs)
  })

  //   test
  //   .do(function () {
  //     logplexCreationMutation = () => ({
  //       functionID: '11111111-1111-1111-1111-111111111111',
  //       logSessionURL: `${logSessionURLBase}${logSessionURLAddress}`,
  //     })

  //     graphqlHandler = sinon.spy((_uri, {query, variables}, cb) => {
  //       return executeQuery(query, variables, {
  //         Function: () => ({
  //           functionID: '11111111-1111-1111-1111-111111111111',
  //           lineCount: 10,
  //           tail: true,
  //         }),
  //         Mutation: () => ({
  //           logSessionStart: logplexCreationMutation,
  //         }),
  //       })
  //       .then(result => cb(null, [200, result]))
  //     })
  //   })
  //   .nock(logSessionURLBase, {}, api => api
  //   .get(logSessionURLAddress)
  //   .reply(404, (_uri: any, _requestBody: any) => {}),
  //   )
  //   .nock('https://api.evergreen.salesforce.com', {
  //     reqheaders: {
  //       Authorization: /Bearer/i,
  //       'content-type': v => v.includes('application/json'),
  //     },
  //   }, api => api
  //   .post('/graphql')
  //   .twice()
  //   .reply(graphqlHandler),
  //   )
  //   .command(['evergreen:logs', '--space=production', '--app=functions', '--function=functionName'])
  //   .catch((error: Error) => expect(error.message).to.equal('Request failed with status code 404'))
  //   .it('shows 404 error')

  //   test
  //   .do(function () {
  //     logplexCreationMutation = () => ({
  //       functionID: '11111111-1111-1111-1111-111111111111',
  //       logSessionURL: `${logSessionURLBase}${logSessionURLAddress}`,
  //     })

//     graphqlHandler = sinon.spy((_uri, {query, variables}, cb) => {
//       return executeQuery(query, variables, {
//         Function: () => ({
//           functionID: '11111111-1111-1111-1111-111111111111',
//           lineCount: 10,
//           tail: true,
//         }),
//         Mutation: () => ({
//           logSessionStart: logplexCreationMutation,
//         }),
//       })
//       .then(result => cb(null, [200, result]))
//     })
//   })
//   .nock(logSessionURLBase, {}, api => api
//   .get(logSessionURLAddress)
//   .reply(403, (_uri: any, _requestBody: any) => {}),
//   )
//   .nock('https://api.evergreen.salesforce.com', {
//     reqheaders: {
//       Authorization: /Bearer/i,
//       'content-type': v => v.includes('application/json'),
//     },
//   }, api => api
//   .post('/graphql')
//   .twice()
//   .reply(graphqlHandler),
//   )
//   .command(['evergreen:logs', '--space=production', '--app=functions', '--function=functionName'])
//   .catch((error: Error) => expect(error.message).to.equal('Request failed with status code 403'))
//   .it('shows 403 error')
})
