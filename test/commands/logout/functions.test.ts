/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { test } from '@oclif/test';
import type { SfTokens } from '@salesforce/core';
import { TokenAccessor } from '@salesforce/core/lib/stateAggregator';
import * as sinon from 'sinon';
import { AuthStubs } from '../../helpers/auth';

describe('sf logout functions', () => {
  let contents: SfTokens;

  beforeEach(() => {
    AuthStubs.tokensWrite.callsFake(async function (this: TokenAccessor) {
      contents = this.getAll(true);
      return contents;
    });
  });

  test
    .stdout()
    .stderr()
    .command(['logout:functions'])
    .it('removes the functions key from the tokens field on logout', (ctx) => {
      sinon.assert.match(contents, {});
    });
});
