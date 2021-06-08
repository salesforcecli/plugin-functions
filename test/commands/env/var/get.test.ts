/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';

describe('sf env:var:get', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) =>
      api.get('/apps/my-environment/config-vars').reply(200, {
        foo: 'bar',
        baz: 'baq',
      })
    )
    .command(['env:var:get', 'foo', '--environment', 'my-environment'])
    .it('returns the value of a config var when it exists', (ctx) => {
      expect(ctx.stdout).to.contain('bar');
    });

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => api.get('/apps/my-environment/config-vars').reply(200, {}))
    .command(['env:var:get', 'foo', '--environment', 'my-environment'])
    .it('shows a message when the config var is not defined', (ctx) => {
      expect(ctx.stderr).to.include(' ›   Warning: No config var named foo found for environment my-environment\n');
    });
});
