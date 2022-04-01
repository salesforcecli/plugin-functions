/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { expect, test } from '@oclif/test';
import * as sinon from 'sinon';
import { LocalRun, LocalRunProcess } from '@heroku/functions-core';
import { SinonStub, SinonStubbedInstance } from 'sinon';
import { LangRunnerOpts } from '@heroku/functions-core/dist/lang-runner';
import Local from '../../../../../src/commands/run/function/start/local';

describe('run:function:start:local', () => {
  const fixturesPath = path.resolve(__dirname, '../../../../fixtures');
  const jsPath = path.resolve(fixturesPath, 'javascripttemplate');
  const javaPath = path.resolve(fixturesPath, 'javatemplate');
  const tsPath = path.resolve(fixturesPath, 'typescripttemplate');

  let sandbox: sinon.SinonSandbox;
  let localRunConstructor: SinonStub<[lang?: string | undefined, runnerOpts?: LangRunnerOpts | undefined], LocalRun>;
  let localRun: SinonStubbedInstance<LocalRun>;
  let childProcess: ChildProcess;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    childProcess = new EventEmitter() as ChildProcess;

    localRun = sandbox.createStubInstance(LocalRun);

    localRun.exec.callsFake(() => {
      const localProcessRun = new LocalRunProcess(childProcess);
      setTimeout(() => childProcess.emit('close'), 100);
      return Promise.resolve(localProcessRun);
    });

    localRunConstructor = sandbox.stub(Local, 'createLocalRun').returns(localRun);
  });

  afterEach(() => {
    sandbox.restore();
  });

  context('without a language argument and a package.json', () => {
    test
      .command(['run:function:start:local', '--path', jsPath])
      .it('should start the Node.js invoker runtime', (ctx) => {
        expect(localRunConstructor).to.have.been.calledWith('auto', {
          port: 8080,
          debugPort: 9229,
          path: jsPath,
        });
      });
  });

  context('with --language=auto and a package.json', () => {
    test
      .command(['run:function:start:local', '--language', 'auto', '--path', jsPath])
      .it('should start the Node.js invoker runtime', (ctx) => {
        expect(localRunConstructor).to.have.been.calledWith('auto', {
          port: 8080,
          debugPort: 9229,
          path: jsPath,
        });
      });
  });

  context('without a language argument and a pom.xml', () => {
    test
      .command(['run:function:start:local', '--path', javaPath])
      .it('should start the Java invoker runtime', (ctx) => {
        expect(localRunConstructor).to.have.been.calledWith('auto', {
          port: 8080,
          debugPort: 9229,
          path: javaPath,
        });
      });
  });

  context('without --language=auto and a pom.xml', () => {
    test
      .command(['run:function:start:local', '--language', 'auto', '--path', javaPath])
      .it('should start the Java invoker runtime', (ctx) => {
        expect(localRunConstructor).to.have.been.calledWith('auto', {
          port: 8080,
          debugPort: 9229,
          path: javaPath,
        });
      });
  });

  context('with --language javascript', () => {
    test
      .command(['run:function:start:local', '--path', jsPath, '-l', 'javascript'])
      .it('should start the Node.js invoker runtime', (ctx) => {
        expect(localRunConstructor).to.have.been.calledWith('javascript', {
          port: 8080,
          debugPort: 9229,
          path: jsPath,
        });
      });
  });

  context('with --language typescript', () => {
    test
      .command(['run:function:start:local', '--path', tsPath, '-l', 'typescript'])
      .it('should start the Node.js invoker runtime', (ctx) => {
        expect(localRunConstructor).to.have.been.calledWith('typescript', {
          port: 8080,
          debugPort: 9229,
          path: tsPath,
        });
      });
  });

  context('with --language java', () => {
    test
      .command(['run:function:start:local', '--path', javaPath, '-l', 'java'])
      .it('should start the Java invoker runtime', (ctx) => {
        expect(localRunConstructor).to.have.been.calledWith('java', {
          port: 8080,
          debugPort: 9229,
          path: javaPath,
        });
      });
  });
});
