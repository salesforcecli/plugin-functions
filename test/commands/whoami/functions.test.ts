/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';

describe('sf whoami:functions', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => {
      api.get('/account').reply(200, {});
    })
    .command(['whoami:functions', '--show-token', '--json'])
    .it('shows messages in json format', (ctx) => {
      expect(ctx.stdout).to.include(
        '{\n  "status": 0,\n  "result": {\n    "functionsToken": "password"\n  },\n  "warnings": []\n}'
      );
      expect(ctx.stdout).to.not.include('Here is some information on your functions account:');
    });
});
