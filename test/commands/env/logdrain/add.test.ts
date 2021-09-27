/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import vacuum from '../../../helpers/vacuum';

const APP_NAME = 'my-app';

const LOG_DRAIN = {
  id: '1',
  url: 'https://logs-r-us.com/1',
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
    .stderr()
    .nock('https://api.heroku.com', (api) => api.post(`/apps/${APP_NAME}/log-drains`).reply(200, LOG_DRAIN))
    .command(['env:logdrain:add', '--environment', APP_NAME, '-l', LOG_DRAIN.url])
    .retries(3)
    .it('will use a compute environment if passed using the old flag (not --target-compute)', (ctx) => {
      expect(vacuum(ctx.stderr).replace(/\n[›»]/gm, '')).to.contain(
        vacuum(
          '--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.'
        )
      );
    });

  test
    .stderr()
    .nock('https://api.heroku.com', (api) => api.post(`/apps/${APP_NAME}/log-drains`).reply(200, LOG_DRAIN))
    .command(['env:logdrain:add', '--target-compute', APP_NAME, '-u', LOG_DRAIN.url])
    .retries(3)
    .it('will use url if passed using the old flag (not --drain-url)', (ctx) => {
      expect(vacuum(ctx.stderr).replace(/\n[›»]/gm, '')).to.contain(
        vacuum('--url is deprecated and will be removed in a future release. Please use --drain-url going forward.')
      );
    });
});
