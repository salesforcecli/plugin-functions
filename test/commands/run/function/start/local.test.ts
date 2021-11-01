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
  const fixturesPath = path.resolve(__dirname, '../../../../fixtures');
  const jsPath = path.resolve(fixturesPath, 'javascripttemplate');
  const javaPath = path.resolve(fixturesPath, 'javatemplate');
  const tsPath = path.resolve(fixturesPath, 'typescripttemplate');

  let sandbox: sinon.SinonSandbox;
  let commandSpy: any;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    commandSpy = sandbox.stub(execa, 'command');
  });

  afterEach(() => {
    sandbox.restore();
  });

  context('without a language argument and a package.json', () => {
    test
      .command(['run:function:start:local', '--path', jsPath])
      .it('should start the Node.js invoker runtime', (ctx) => {
        expect(commandSpy).to.have.been.calledWith(sinon.match('@heroku/sf-fx-runtime-nodejs'));
      });
  });

  context('with --language=auto and a package.json', () => {
    test
      .command(['run:function:start:local', '--language', 'auto', '--path', jsPath])
      .it('should start the Node.js invoker runtime', (ctx) => {
        expect(commandSpy).to.have.been.calledWith(sinon.match('@heroku/sf-fx-runtime-nodejs'));
      });
  });

  context('without a language argument and a pom.xml', () => {
    test
      .command(['run:function:start:local', '--path', javaPath])
      .it('should start the Java invoker runtime', (ctx) => {
        expect(commandSpy).to.have.been.calledWith(sinon.match('@heroku/sf-fx-runtime-nodejs'));
      });
  });

  context('without --language=auto and a pom.xml', () => {
    test
      .command(['run:function:start:local', '--language', 'auto', '--path', javaPath])
      .it('should start the Java invoker runtime', (ctx) => {
        expect(commandSpy).to.have.been.calledWith(sinon.match('@heroku/sf-fx-runtime-nodejs'));
      });
  });

  context('with --language javascript', () => {
    test
      .command(['run:function:start:local', '--path', jsPath, '-l', 'javascript'])
      .it('should start the Node.js invoker runtime', (ctx) => {
        expect(commandSpy).to.have.been.calledWith(sinon.match('@heroku/sf-fx-runtime-nodejs'));
      });
  });

  context('with --language typescript', () => {
    test
      .command(['run:function:start:local', '--path', tsPath, '-l', 'typescript'])
      .it('should start the Node.js invoker runtime', (ctx) => {
        expect(commandSpy).to.have.been.calledWith(sinon.match('@heroku/sf-fx-runtime-nodejs'));
      });
  });

  context('with --language java', () => {
    test
      .command(['run:function:start:local', '--path', javaPath, '-l', 'java'])
      .it('should start the Java invoker runtime', (ctx) => {
        expect(commandSpy).to.have.been.calledWith(sinon.match('sf-fx-runtime-java'));
      });
  });
});
