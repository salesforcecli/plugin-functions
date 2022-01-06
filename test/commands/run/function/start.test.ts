/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { test } from '@oclif/test';
import * as sinon from 'sinon';

import * as library from '@heroku/functions-core';
import { Benny } from '@heroku/functions-core';

describe('function:start', () => {
  let sandbox: sinon.SinonSandbox;
  let bennyRunStub: sinon.SinonStub;
  let bennyBuildStub: sinon.SinonStub;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    bennyRunStub = sandbox.stub(Benny.prototype, 'run');
    bennyBuildStub = sandbox.stub(Benny.prototype, 'build');
    bennyRunStub.returns(true);
    bennyBuildStub.returns(true);
    sandbox
      .stub(library, 'getProjectDescriptor')
      .returns(Promise.resolve({ com: { salesforce: { id: 'allthethingsfunction' } } }));
  });

  afterEach(() => {
    sandbox.restore();
  });

  test.command(['run:function:start']).it('Should call the library methods', async () => {
    sinon.assert.calledOnce(bennyBuildStub);
    sinon.assert.calledOnce(bennyRunStub);
  });
});
