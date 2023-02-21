/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { Readable } from 'stream';
import { test } from '@oclif/test';
import * as sinon from 'sinon';
import { LocalRun, LocalRunProcess } from '@heroku/functions-core';

describe('sdf run function start', () => {
  let sandbox: sinon.SinonSandbox;
  let localRunExecStub: sinon.SinonStub;
  let childProcess: ChildProcess;

  function setupSuccessfulExecution() {
    localRunExecStub.callsFake(() => {
      const localRunProcess = new LocalRunProcess(childProcess);
      setTimeout(() => childProcess.emit('close'), 100);
      return Promise.resolve(localRunProcess);
    });
  }

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    childProcess = createMockChildProcess();

    localRunExecStub = sandbox.stub(LocalRun.prototype, 'exec');
  });

  afterEach(() => {
    sandbox.restore();
  });

  test
    .do(setupSuccessfulExecution)
    .command(['run:function:start'])
    .it('Should call LocalRun.exec', async () => {
      sinon.assert.calledOnce(localRunExecStub);
    });
});

function createMockChildProcess(): ChildProcess {
  const childProcess = new EventEmitter() as ChildProcess;
  childProcess.stderr = new EventEmitter() as Readable;
  childProcess.stdout = new EventEmitter() as Readable;
  childProcess.stderr = new EventEmitter() as Readable;
  childProcess.kill = () => {
    childProcess.emit('close');
    return true;
  };
  return childProcess;
}
