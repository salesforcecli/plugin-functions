/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import vacuum from '../../../helpers/vacuum';

describe('sf env:var:unset', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) =>
      api
        .patch('/apps/my-environment/config-vars', {
          foo: null,
        })
        .reply(200)
    )
    .command(['env:var:unset', 'foo', '--target-compute', 'my-environment'])
    .it('works with a single variable', (ctx) => {
      expect(ctx.stderr).to.contain('Unsetting foo and restarting my-environment');
    });

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) =>
      api
        .patch('/apps/my-environment/config-vars', {
          foo: null,
          bar: null,
        })
        .reply(200)
    )
    .command(['env:var:unset', 'foo', 'bar', '--target-compute', 'my-environment'])
    .it('works with a multiple variables', (ctx) => {
      expect(ctx.stderr).to.contain('Unsetting foo, bar and restarting my-environment');
    });

  test

    .stderr()
    .nock('https://api.heroku.com', (api) =>
      api
        .patch('/apps/my-environment/config-vars', {
          foo: null,
        })
        .reply(200)
    )
    .command(['env:var:unset', 'foo', '--environment', 'my-environment'])
    .it('will use a compute environment if passed using the old flag (not --target-compute)', (ctx) => {
      expect(vacuum(ctx.stderr).replace(/\n[›»]/gm, '')).to.contain(
        vacuum(
          '--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.'
        )
      );
    });

  test
    .stderr()
    .command(['env:var:unset', '--target-compute', 'my-environment'])
    .catch((error) => {
      expect(error.message).to.contain('you must enter a config var key (i.e. mykey)');
    })
    .it('errors when no argument is given');
});
