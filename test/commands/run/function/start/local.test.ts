/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { expect, test } from '@oclif/test';
import * as execa from 'execa';
import * as sinon from 'sinon';

describe('run:function:start:local', () => {
  const rootPath = path.resolve(__dirname, '../../../../..');
  let sandbox: sinon.SinonSandbox;
  let commandSpy: any;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    commandSpy = sandbox.stub(execa, 'command');
  });

  afterEach(() => {
    sandbox.restore();
  });

  context('with --language javascript', () => {
    test
      .stdout()
      .stderr()
      .command(['run:function:start:local', '--path', rootPath, '-l', 'javascript'])
      .it('should start the javascript invoker', (ctx) => {
        expect(commandSpy).to.have.been.calledWith(sinon.match('@heroku/sf-fx-runtime-nodejs'));
      });
  });
});
