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
import { LocalRun, LocalRunProcess } from '@hk/functions-core';
import { SinonStub, SinonStubbedInstance } from 'sinon';
import { LangRunnerOpts } from '@hk/functions-core/dist/lang-runner';
import Local from '../../../../../src/commands/run/function/start/local';

describe('sf run function start local', () => {
  const defaultFunctionPath = path.resolve('.');
  const customFunctionPath = 'some/functions/path';

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

  context('without any arguments', () => {
    test.command(['run:function:start:local']).it('should start the local runner with default options', (ctx) => {
      expect(localRunConstructor).to.have.been.calledWith('auto', {
        port: 8080,
        debugPort: 9229,
        path: defaultFunctionPath,
      });
    });
  });

  context('with --language=auto', () => {
    test
      .command(['run:function:start:local', '--language', 'auto'])
      .it('should start the local runner in auto mode', (ctx) => {
        expect(localRunConstructor).to.have.been.calledWith('auto', {
          port: 8080,
          debugPort: 9229,
          path: defaultFunctionPath,
        });
      });
  });

  context('with -l java', () => {
    test.command(['run:function:start:local', '-l', 'java']).it('should start the local runner in java mode', (ctx) => {
      expect(localRunConstructor).to.have.been.calledWith('java', {
        port: 8080,
        debugPort: 9229,
        path: defaultFunctionPath,
      });
    });
  });

  context('with -l javascript', () => {
    test
      .command(['run:function:start:local', '-l', 'javascript'])
      .it('should start the local runner in javascript mode', (ctx) => {
        expect(localRunConstructor).to.have.been.calledWith('javascript', {
          port: 8080,
          debugPort: 9229,
          path: defaultFunctionPath,
        });
      });
  });

  context('with -l python', () => {
    test
      .command(['run:function:start:local', '-l', 'python'])
      .it('should start the local runner in python mode', (ctx) => {
        expect(localRunConstructor).to.have.been.calledWith('python', {
          port: 8080,
          debugPort: 9229,
          path: defaultFunctionPath,
        });
      });
  });

  context('with -l typescript', () => {
    test
      .command(['run:function:start:local', '-l', 'typescript'])
      .it('should start the local runner in typescript mode', (ctx) => {
        expect(localRunConstructor).to.have.been.calledWith('typescript', {
          port: 8080,
          debugPort: 9229,
          path: defaultFunctionPath,
        });
      });
  });

  context('with --path', () => {
    test
      .command(['run:function:start:local', '--language', 'auto', '--path', customFunctionPath])
      .it('should start the local runner with a custom path', (ctx) => {
        expect(localRunConstructor).to.have.been.calledWith('auto', {
          port: 8080,
          debugPort: 9229,
          path: customFunctionPath,
        });
      });
  });

  context('with --port and --debug-port', () => {
    test
      .command(['run:function:start:local', '--port', '1111', '--debug-port', '2222'])
      .it('should start the local runner with custom ports', (ctx) => {
        expect(localRunConstructor).to.have.been.calledWith('auto', {
          port: 1111,
          debugPort: 2222,
          path: defaultFunctionPath,
        });
      });
  });

  context('with -p and -b', () => {
    test
      .command(['run:function:start:local', '-p', '1111', '-b', '2222'])
      .it('should start the local runner with custom ports', (ctx) => {
        expect(localRunConstructor).to.have.been.calledWith('auto', {
          port: 1111,
          debugPort: 2222,
          path: defaultFunctionPath,
        });
      });
  });
});
