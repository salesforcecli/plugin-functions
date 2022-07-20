/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { readFileSync } from 'fs';
import { expect, test } from '@oclif/test';
import vacuum from '../../helpers/vacuum';
const fs = require('fs');

describe('logs', () => {
  const logSessionURLAddress = '/stream/5634e5b9-f9d4-48de-8c8c-4e368e5d40ff?srv=example';
  const logSessionURLBase = 'https://va.logs.heroku.com';
  const appName = 'foo-app-bar';

  const fakeResponseData = {
    logplex_url: `${logSessionURLBase}${logSessionURLAddress}`,
  };

  test
    .stdout()
    .nock(logSessionURLBase, {}, (api) =>
      api.get(logSessionURLAddress).reply(200, (_uri: any, _requestBody: any) => {
        return fs.createReadStream('test/helpers/logoutput.txt');
      })
    )
    .nock('https://api.heroku.com', (api) => api.post(`/apps/${appName}/log-sessions`).reply(200, fakeResponseData))
    .command(['env:log', `--target-compute=${appName}`])
    .it('shows logSessionURL', (ctx) => {
      const logs = readFileSync('test/helpers/logoutput.txt', 'utf-8');
      expect(ctx.stdout).to.include(logs);
    });

  test
    .stdout()
    .nock(logSessionURLBase, {}, (api) =>
      api.get(logSessionURLAddress).reply(200, (_uri: any, _requestBody: any) => {
        return fs.createReadStream('test/helpers/logoutput.txt');
      })
    )
    .nock('https://api.heroku.com', (api) => api.post(`/apps/${appName}/log-sessions`).reply(200, fakeResponseData))
    .command(['env:log', `--target-compute=${appName}`, '--num=3'])
    .it('properly captures correct parameters', (ctx) => {
      const logs = readFileSync('test/helpers/logoutput.txt', 'utf-8');
      expect(ctx.stdout).to.include(logs);
    });

  test
    .stdout()
    .nock(logSessionURLBase, {}, (api) =>
      api.get(logSessionURLAddress).reply(200, (_uri: any, _requestBody: any) => {
        return fs.createReadStream('test/helpers/logoutput.txt');
      })
    )
    .nock('https://api.heroku.com', (api) => api.post(`/apps/${appName}/log-sessions`).reply(200, fakeResponseData))
    .command(['env:log', `--environment=${appName}`])
    .it('will use a compute environment if passed using the old flag (not --target-compute)', (ctx) => {
      expect(vacuum(ctx.stdout).replace(/\n[›»]/gm, '')).to.contain(
        vacuum(
          '--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.'
        )
      );
    });

  test
    .stdout()
    .nock(logSessionURLBase, {}, (api) => api.get(logSessionURLAddress).reply(404, {}))
    .nock('https://api.heroku.com', (api) => api.post(`/apps/${appName}/log-sessions`).reply(200, fakeResponseData))
    .command(['env:log', `--target-compute=${appName}`])
    .catch((error: Error) => expect(error.message).to.equal('Request failed with status code 404'))
    .it('shows 404 error');

  test
    .stdout()
    .nock(logSessionURLBase, {}, (api) => api.get(logSessionURLAddress).reply(403, {}))
    .nock('https://api.heroku.com', (api) => api.post(`/apps/${appName}/log-sessions`).reply(200, fakeResponseData))
    .command(['env:log', `--target-compute=${appName}`])
    .catch((error: Error) => expect(error.message).to.equal('Request failed with status code 403'))
    .it('shows 403 error');
});
