/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import * as sinon from 'sinon';
import * as library from '@heroku/functions-core';
import vacuum from '../../helpers/vacuum';

describe('sf generate project', () => {
  const sandbox: sinon.SinonSandbox = sinon.createSandbox();
  let generateProjectStub: sinon.SinonStub;
  const name = 'myfunction';
  beforeEach(() => {
    generateProjectStub = sandbox.stub(library, 'generateProject');
  });
  afterEach(() => {
    sandbox.restore();
  });

  test
    .stdout()
    .command(['generate:project', `--project-name=${name}`])
    .it('Should call the library methods with proper args and log output', async (ctx) => {
      expect(generateProjectStub).to.have.been.calledWith(name);
    });

  test
    .stderr()
    .command(['generate:project', `--name=${name}`])
    .it('will use name if passed using the old flag (not --project-name)', (ctx) => {
      expect(vacuum(ctx.stderr).replace(/\n[›»]/gm, '')).to.contain(
        vacuum('--name is deprecated and will be removed in a future release. Please use --project-name going forward.')
      );
    });

  test
    .do(() => {
      generateProjectStub.rejects(new Error('something bad happened'));
    })
    .command(['generate:project', `--project-name=${name}`])
    .catch((error) => {
      expect(error.message).to.contain('something bad happened');
    })
    .it('Should log errors', async (ctx) => {
      expect(generateProjectStub).to.have.been.calledWith(name);
    });
});
