/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import type { GlobalInfo, SfTokens } from '@salesforce/core';
import * as sinon from 'sinon';
import { AuthStubs } from '../../helpers/auth';
import vacuum from '../../helpers/vacuum';

describe('sf logout functions', () => {
  let contents: SfTokens;

  beforeEach(() => {
    AuthStubs.write.callsFake(async function (this: GlobalInfo) {
      contents = this.tokens.getAll(true);
      return this.getContents();
    });
  });

  test
    .stdout()
    .stderr()
    .command(['logout:functions'])
    .it('removes the functions key from the tokens field on logout', (ctx) => {
      sinon.assert.match(contents, {});
    });
  test
    .stdout()
    .stderr()
    .command(['logout:functions', '-j'])
    .it('will show json output', (ctx) => {
      expect(vacuum(ctx.stdout).replace(/\n[›»]/gm, '')).to.contain(
        vacuum('{\n"status": 0,\n"result": [],\n"warnings": []\n}')
      );
    });
});
