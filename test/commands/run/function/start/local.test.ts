/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { test } from '@oclif/test';
import * as sinon from 'sinon';

describe('run:function', () => {
  let sandbox: sinon.SinonSandbox;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  context('with --language javascript', () => {
    test
      .stdout()
      .stderr()
      .command(['run:function:start:local', '-l', 'javascript'])
      .it('should start the javascript invoker');
  });
});
