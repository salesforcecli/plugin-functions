/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import vacuum from '../../../helpers/vacuum';

const APP_NAME = 'my-app';

const LOG_DRAINS = [
  {
    id: '1',
    url: 'https://logs-r-us.com/1',
  },
  {
    id: '2',
    url: 'https://logs-r-us.com/2',
  },
];

const SUCCESS_OUTPUT = {
  status: 0,
  result: LOG_DRAINS,
  warnings: [],
};

describe('sf env logdrain list', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => api.get(`/apps/${APP_NAME}/log-drains`).reply(200, LOG_DRAINS))
    .command(['env:logdrain:list', '-e', APP_NAME])
    .it('shows a list of log drains', (ctx) => {
      expect(vacuum(ctx.stdout)).to.contain(
        vacuum(`
    ID URL
    ── ───────────────────────
    1  https://logs-r-us.com/1
    2  https://logs-r-us.com/2
    `)
      );
    });

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => api.get(`/apps/${APP_NAME}/log-drains`).reply(200, []))
    .command(['env:logdrain:list', '-e', APP_NAME])
    .it('shows a list of log drains', (ctx) => {
      expect(ctx.stdout).to.contain(`No log drains found for environment ${APP_NAME}.`);
    });

  test
    .stderr()
    .nock('https://api.heroku.com', (api) => api.get(`/apps/${APP_NAME}/log-drains`).reply(200, LOG_DRAINS))
    .command(['env:logdrain:list', '--environment', APP_NAME])
    .it('will use a compute environment if passed using the old flag (not --target-compute)', (ctx) => {
      expect(vacuum(ctx.stderr).replace(/\n[›»]/gm, '')).to.contain(
        vacuum(
          '--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.'
        )
      );
    });

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => api.get(`/apps/${APP_NAME}/log-drains`).reply(200, LOG_DRAINS))
    .command(['env:logdrain:list', '-e', APP_NAME, '--json'])
    .it('shows log drains in JSON when --json is passed', (ctx) => {
      expect(JSON.parse(ctx.stdout)).to.deep.equal(SUCCESS_OUTPUT);
    });
});
