/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import vacuum from '../../../helpers/vacuum';

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
    .command(['env:var:get', 'foo', '--target-compute', 'my-environment'])
    .it('returns the value of a config var when it exists', (ctx) => {
      expect(ctx.stdout).to.contain('bar');
    });

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => api.get('/apps/my-environment/config-vars').reply(200, {}))
    .command(['env:var:get', 'foo', '--target-compute', 'my-environment'])
    .it('shows a message when the config var is not defined', (ctx) => {
      expect(ctx.stderr).to.include('Warning: No config var named foo found for environment my-environment');
    });

  test
    .stderr()
    .nock('https://api.heroku.com', (api) =>
      api.get('/apps/my-environment/config-vars').reply(200, {
        foo: 'bar',
      })
    )
    .command(['env:var:get', 'foo', '--environment', 'my-environment'])
    .it('will use a compute environment if passed using the old flag (not --target-compute)', (ctx) => {
      expect(vacuum(ctx.stderr).replace(/\n[›»]/gm, '')).to.contain(
        vacuum(
          '--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.'
        )
      );
    });

  test
    .stdout()
    .nock('https://api.heroku.com', (api) =>
      api.get('/apps/my-environment/config-vars').reply(200, {
        foo: 'bar',
      })
    )
    .command(['env:var:get', 'foo', '--environment', 'my-environment', '--json'])
    .it('will show json output', (ctx) => {
      expect(vacuum(ctx.stdout).replace(/\n[›»]/gm, '')).to.contain(
        vacuum('{\n"status": 0,\n"result": "bar",\n"warnings": []\n}')
      );
    });

  test
    .stdout()
    .nock('https://api.heroku.com', (api) =>
      api.get('/apps/my-environment/config-vars').reply(200, {
        foo: 'bar',
      })
    )
    .command(['env:var:get', 'doo', '--environment', 'my-environment', '--json'])
    .it('will show json warning output with incorrect config var', (ctx) => {
      expect(vacuum(ctx.stdout).replace(/\n[›»]/gm, '')).to.contain(
        vacuum(
          '{\n"status": 0,\n"result": null,\n"warnings": [\n"No config var named doo found for environment <my-environment>"\n]\n}'
        )
      );
    });
});
