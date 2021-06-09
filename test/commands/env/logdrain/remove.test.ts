/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';

const APP_NAME = 'my-app';

const LOG_DRAIN = {
  id: '1',
  url: 'https://logs-r-us.com/1',
};

describe('sf env logdrain remove', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) =>
      api.delete(`/apps/${APP_NAME}/log-drains/${encodeURIComponent(LOG_DRAIN.url)}`).reply(200, LOG_DRAIN)
    )
    .command(['env:logdrain:remove', '-e', APP_NAME, '-u', LOG_DRAIN.url])
    .it('deletes a log drain', (ctx) => {
      expect(ctx.stderr).to.contain(`Deleting drain for environment ${APP_NAME}`);
    });
});
