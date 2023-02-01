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

describe('sf generate function', () => {
  const sandbox: sinon.SinonSandbox = sinon.createSandbox();
  let generateFunctionStub: sinon.SinonStub;
  const path = 'some/functions/path';
  const name = 'myfunction';
  const language = 'javascript';
  beforeEach(() => {
    generateFunctionStub = sandbox.stub(library, 'generateFunction');
  });
  afterEach(() => {
    sandbox.restore();
  });

  test
    .stdout()
    .do(() => {
      generateFunctionStub.returns({
        name,
        path,
        language,
        welcomeText: '',
      });
    })
    .command(['generate:function', `--function-name=${name}`, '--language=javascript'])
    .it('Should call the library methods with proper args and log output', async (ctx) => {
      expect(generateFunctionStub).to.have.been.calledWith(name, language);
      expect(ctx.stdout).to.contain(`Created ${language} function ${name} in ${path}`);
    });

  test
    .stdout()
    .do(() => {
      generateFunctionStub.returns({
        name,
        path,
        language,
        welcomeText: '',
      });
    })
    .command(['generate:function', `--name=${name}`, '--language=javascript'])
    .it('will use name if passed using the old flag (not --function-name)', (ctx) => {
      expect(vacuum(ctx.stdout).replace(/\n[›»]/gm, '')).to.contain(
        vacuum(
          '--name is deprecated and will be removed in a future release. Please use --function-name going forward.'
        )
      );
    });

  test
    .do(() => {
      generateFunctionStub.returns({
        name,
        path,
        language,
        welcomeText: 'Before each...',
      });
    })
    .stdout()
    .command(['generate:function', `--function-name=${name}`, '--language=javascript'])
    .it('Should log welcome message', async (ctx) => {
      expect(generateFunctionStub).to.have.been.calledWith('myfunction', 'javascript');
      expect(ctx.stdout).to.contain('Before each...');
    });

  test
    .do(() => {
      generateFunctionStub.rejects(new Error('something bad happened'));
    })
    .command(['generate:function', `--function-name=${name}`, '--language=javascript'])
    .catch((error) => {
      expect(error.message).to.contain('something bad happened');
    })
    .it('Should log errors', async (ctx) => {
      expect(generateFunctionStub).to.have.been.calledWith('myfunction', 'javascript');
    });
});
