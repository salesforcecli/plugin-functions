/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import vacuum from '../../../helpers/vacuum';

describe('sf env:var:set', () => {
  test
    .stdout()
    .stderr()
    // Adding retries here because there is some kind of race condition that causes fancy-test to not
    // fully capture the value of stderr when running in CI (╯°□°)╯︵ ┻━┻
    .retries(2)
    .nock('https://api.heroku.com', (api) =>
      api
        .patch('/apps/my-environment/config-vars', {
          foo: 'bar',
        })
        .reply(200)
    )
    .command(['env:var:set', 'foo=bar', '--target-compute', 'my-environment'])
    .it('works with a single variable', (ctx) => {
      expect(ctx.stderr).to.contain('Setting foo and restarting my-environment');
    });

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) =>
      api
        .patch('/apps/my-environment/config-vars', {
          foo: 'bar',
          bar: 'baz',
        })
        .reply(200)
    )
    .command(['env:var:set', 'foo=bar', 'bar=baz', '--target-compute', 'my-environment'])
    .it('works with a multiple variables', (ctx) => {
      expect(ctx.stderr).to.contain('Setting foo, bar and restarting my-environment');
    });

  test
    .stdout()
    .stderr()
    // Adding retries here because there is some kind of race condition that causes fancy-test to not
    // fully capture the value of stderr when running in CI (╯°□°)╯︵ ┻━┻
    .retries(2)
    .nock('https://api.heroku.com', (api) =>
      api
        .patch('/apps/my-environment/config-vars', {
          foo: 'bar=baz',
        })
        .reply(200)
    )
    .command(['env:var:set', 'foo=bar=baz', '--target-compute', 'my-environment'])
    .it('allows equals sign in config pair value', (ctx) => {
      expect(ctx.stderr).to.contain('Setting foo and restarting my-environment');
    });

  test
    .stderr()
    // Adding retries here because there is some kind of race condition that causes fancy-test to not
    // fully capture the value of stderr when running in CI (╯°□°)╯︵ ┻━┻
    .retries(2)
    .nock('https://api.heroku.com', (api) =>
      api
        .patch('/apps/my-environment/config-vars', {
          foo: 'bar',
        })
        .reply(200)
    )
    .command(['env:var:set', 'foo=bar', '--environment', 'my-environment'])
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
    // Adding retries here because there is some kind of race condition that causes fancy-test to not
    // fully capture the value of stderr when running in CI (╯°□°)╯︵ ┻━┻
    .retries(2)
    .nock('https://api.heroku.com', (api) =>
      api
        .patch('/apps/my-environment/config-vars', {
          foo: 'bar baz',
        })
        .reply(200)
    )
    .command(['env:var:set', 'foo=bar baz', '--target-compute', 'my-environment'])
    .it('allows spaces in config pair value', (ctx) => {
      expect(ctx.stderr).to.contain('Setting foo and restarting my-environment');
    });

  test
    .command(['env:var:set', 'foobar', '--target-compute', 'my-environment'])
    .catch((error) => {
      expect(error.message).to.contain('foobar is invalid. Please use the format key=value');
    })
    .it('fails when arguments are not in the correct format');

  test
    .stdout()
    // Adding retries here because there is some kind of race condition that causes fancy-test to not
    // fully capture the value of stderr when running in CI (╯°□°)╯︵ ┻━┻
    .retries(2)
    .nock('https://api.heroku.com', (api) =>
      api
        .patch('/apps/my-environment/config-vars', {
          foo: 'bar',
        })
        .reply(200)
    )
    .command(['env:var:set', 'foo=bar', '--target-compute', 'my-environment', '--json'])
    .it('will show json output', (ctx) => {
      expect(vacuum(ctx.stdout).replace(/\n[›»]/gm, '')).to.contain(
        vacuum('{\n"status": 0,\n"result": [],\n"warnings": []\n}')
      );
    });
});
