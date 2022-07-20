/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { CLIError } from '@oclif/core/lib/errors';
import { expect, test } from '@oclif/test';
import vacuum from '../../../helpers/vacuum';

const APP_NAME = 'my-app';

const LOG_DRAIN = {
  id: '1',
  url: 'https://logs-r-us.com/1',
};

const LOG_DRAIN_ENV_ERR = {
  message: "Couldn't find that app.",
};

const LOG_DRAIN_INVALID_URL = {
  message: 'Url is invalid.',
};

const LOG_DRAIN_ALREADY_USED = {
  message: 'Url has already been taken',
};

describe('sf env logdrain add', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => api.post(`/apps/${APP_NAME}/log-drains`).reply(200, LOG_DRAIN))
    .command(['env:logdrain:add', '-e', APP_NAME, '-l', LOG_DRAIN.url])
    .retries(3)
    .it('creates a log drain', (ctx) => {
      expect(ctx.stderr).to.contain(`Creating drain for environment ${APP_NAME}`);
    });

  test
    .stdout()
    .nock('https://api.heroku.com', (api) => api.post(`/apps/${APP_NAME}/log-drains`).reply(200, LOG_DRAIN))
    .command(['env:logdrain:add', '--environment', APP_NAME, '-l', LOG_DRAIN.url])
    .retries(3)
    .it('will use a compute environment if passed using the old flag (not --target-compute)', (ctx) => {
      expect(vacuum(ctx.stdout).replace(/\n[›»]/gm, '')).to.contain(
        vacuum(
          '--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.'
        )
      );
    });

  test
    .stdout()
    .nock('https://api.heroku.com', (api) => api.post(`/apps/${APP_NAME}/log-drains`).reply(200, LOG_DRAIN))
    .command(['env:logdrain:add', '--target-compute', APP_NAME, '-u', LOG_DRAIN.url])
    .retries(3)
    .it('will use url if passed using the old flag (not --drain-url)', (ctx) => {
      expect(vacuum(ctx.stdout).replace(/\n[›»]/gm, '')).to.contain(
        vacuum('--url is deprecated and will be removed in a future release. Please use --drain-url going forward.')
      );
    });

  test
    .stdout()
    .nock('https://api.heroku.com', (api) => api.post(`/apps/${APP_NAME}/log-drains`).reply(200, LOG_DRAIN))
    .command(['env:logdrain:add', '--target-compute', APP_NAME, '-l', LOG_DRAIN.url, '--json'])
    .retries(3)
    .it('will show json output', (ctx) => {
      expect(vacuum(ctx.stdout).replace(/\n[›»]/gm, '')).to.contain(
        vacuum(
          '{\n"status": 0,\n"result": [\n{\n"addon": null,\n"id": "1",\n"url": "https://logs-r-us.com/1"\n}\n],\n"warnings": []\n}'
        )
      );
    });

  test
    .stdout()
    .nock('https://api.heroku.com', (api) =>
      api.post('/apps/invalid-environment/log-drains').reply(404, LOG_DRAIN_ENV_ERR)
    )
    .command(['env:logdrain:add', '--target-compute', 'invalid-environment', '-u', LOG_DRAIN.url, '--json'])
    .catch((error) => {
      expect((error as CLIError).oclif.exit).to.equal(1);
    })
    .it('will show json output error with incorrect compute environment', (ctx) => {
      expect(vacuum(ctx.stdout).replace(/\n[›»]/gm, '')).to.contain(
        vacuum('{\n"status": 1,\n"message": "Could not find environment invalid-environment"')
      );
    });

  test
    .stdout()
    .nock('https://api.heroku.com', (api) => api.post(`/apps/${APP_NAME}/log-drains`).reply(422, LOG_DRAIN_INVALID_URL))
    .command(['env:logdrain:add', '--target-compute', APP_NAME, '-u', 'invalid-url', '--json'])
    .catch((error) => {
      expect((error as CLIError).oclif.exit).to.equal(1);
    })
    .it('will show json output error with incorrect drain-url', (ctx) => {
      expect(vacuum(ctx.stdout).replace(/\n[›»]/gm, '')).to.contain(
        vacuum('{\n"status": 1,\n"message": "URL is invalid invalid-url",\n"name": "Error"')
      );
    });

  test
    .stdout()
    .nock('https://api.heroku.com', (api) =>
      api.post(`/apps/${APP_NAME}/log-drains`).reply(422, LOG_DRAIN_ALREADY_USED)
    )
    .command(['env:logdrain:add', '--target-compute', APP_NAME, '-u', LOG_DRAIN.url, '--json'])
    .catch((error) => {
      expect((error as CLIError).oclif.exit).to.equal(1);
    })
    .it('will show json output error with drain-url already used', (ctx) => {
      expect(vacuum(ctx.stdout).replace(/\n[›»]/gm, '')).to.contain(
        vacuum(
          '{\n"status": 1,\n"message": "Logdrain URL is already added https://logs-r-us.com/1",\n"name": "Error",\n"'
        )
      );
    });
});
