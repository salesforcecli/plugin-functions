/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import * as sinon from 'sinon';
import { LocalRun } from '@heroku/functions-core';

describe('run:function:start', () => {
  let sandbox: sinon.SinonSandbox;
  let localRunExecStub: sinon.SinonStub;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    localRunExecStub = sandbox.stub(LocalRun.prototype, 'exec');
    localRunExecStub.resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  test.command(['run:function:start']).it('Should call LocalRun.exec', async () => {
    sinon.assert.calledOnce(localRunExecStub);
  });

  ['--builder', '--network', '--env'].forEach((deprecatedArg) => {
    describe(`with deprecated arg ${deprecatedArg}`, () => {
      test
        .stderr()
        .command(['run:function:start', deprecatedArg, 'some:val'])
        .it('will include a deprecation notice', (ctx) => {
          expect(ctx.stderr).to.contain(`${deprecatedArg} is deprecated`);
        });
    });
  });

  ['--no-pull', '--no-run', '--no-build'].forEach((deprecatedArg) => {
    describe(`with deprecated flag ${deprecatedArg}`, () => {
      test
        .stderr()
        .command(['run:function:start', deprecatedArg])
        .it('will include a deprecation notice', (ctx) => {
          expect(ctx.stderr).to.contain(`${deprecatedArg} is deprecated`);
        });
    });
  });
});
