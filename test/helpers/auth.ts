/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { AliasAccessor, TokenAccessor } from '@salesforce/core/lib/stateAggregator';
import { stubMethod } from '@salesforce/ts-sinon';
import { createSandbox, SinonStub } from 'sinon';
import NetrcMachine from '../../src/lib/netrc';

const sandbox = createSandbox();

export const AuthStubs: {
  getToken: SinonStub;
  tokensWrite: SinonStub;
  aliasesWrite: SinonStub;
  netrc: SinonStub;
} = {} as any; // set to any - will be initialized later

// Run on next tick after mocha is setup
process.nextTick(() => {
  beforeEach(() => {
    AuthStubs.getToken = stubMethod(sandbox, TokenAccessor.prototype, 'get').returns({
      token: 'password',
      user: 'login',
    });
    // Ensure we don't do an actual write
    AuthStubs.tokensWrite = stubMethod(sandbox, TokenAccessor.prototype, 'write');
    AuthStubs.aliasesWrite = stubMethod(sandbox, AliasAccessor.prototype, 'write');

    // Make sure this returns nothing, it should use it from global info
    AuthStubs.netrc = sandbox.stub(NetrcMachine.prototype, 'get' as any);
    AuthStubs.netrc.withArgs('login').returns('');
    AuthStubs.netrc.withArgs('password').returns('');
  });

  afterEach(() => {
    sandbox.restore();
  });
});
