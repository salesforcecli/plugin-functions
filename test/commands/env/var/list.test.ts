/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';

import vacuum from '../../../helpers/vacuum';

describe('sf env:var:list', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) =>
      api.get('/apps/my-environment/config-vars').reply(200, {
        foo: 'bar',
        baz: 'baq',
      })
    )
    .command(['env:var:list', '--target-compute', 'my-environment'])
    .it('shows a table of config vars', (ctx) => {
      expect(vacuum(ctx.stdout)).to.contain(
        vacuum(`
      Key Value
      ─── ─────
      foo bar
      baz baq
    `)
      );
    });

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => api.get('/apps/my-environment/config-vars').reply(200, {}))
    .command(['env:var:list', '--target-compute', 'my-environment'])
    .it('shows a message when there are no config vars', (ctx) => {
      expect(ctx.stderr).to.include('Warning: No config vars found for environment my-environment');
    });
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) =>
      api.get('/apps/my-environment/config-vars').reply(200, {
        foo: 'bar',
        baz: 'baq',
      })
    )
    .command(['env:var:list', '--environment', 'my-environment', '--json'])
    .it('shows config vars in json format', (ctx) => {
      expect(vacuum(ctx.stdout)).to.contain(
        vacuum(`
        {
          "foo": "bar",
          "baz": "baq"
        }
  `)
      );
    });
});
