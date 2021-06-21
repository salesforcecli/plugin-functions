/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import { Config } from '@salesforce/core';
import { MockTestOrgData, testSetup } from '@salesforce/core/lib/testSetup';
import * as sinon from 'sinon';

import * as library from '@heroku/functions-core';

describe('run:function', () => {
  const $$ = testSetup();
  const targetUrl = 'http://localhost';
  const userpayload = '{"id":654321,"field1":"somefield"}';
  let testData: MockTestOrgData;
  let sandbox: sinon.SinonSandbox;
  let runFunctionStub: sinon.SinonStub;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    runFunctionStub = sandbox.stub(library, 'runFunction');
    runFunctionStub.returns({
      headers: { 'content-type': 'application/json; charset=utf-8' },
      data: 'Something happened!',
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  context('without payload', () => {
    process.stdin.isTTY = true;
    test
      .command(['run:function', '-l', targetUrl])
      .catch(/payload/)
      .it('should mention the missing payload');
  });

  context('with payload and other arguments', () => {
    beforeEach(async () => {
      testData = new MockTestOrgData();
      $$.configStubs.AuthInfoConfig = { contents: await testData.getConfig() };
      const config: Config = await Config.create(Config.getDefaultOptions(true));
      await config.set(Config.DEFAULT_USERNAME, testData.username);
      await config.write();
    });

    test
      .command(['run:function', '-l', targetUrl, '-p', userpayload])
      .it(`Should call the library with payload ${userpayload}`, async () => {
        sinon.assert.calledWith(
          runFunctionStub,
          sinon.match.has('payload', userpayload).and(sinon.match.has('url', targetUrl))
        );
      });
    test
      .command([
        'run:function',
        '-l',
        targetUrl,
        '-p',
        userpayload,
        '-H',
        'TestHeader',
        '--structured',
        '-o',
        Config.DEFAULT_USERNAME,
      ])
      .it('Should call the library with all arguments', async () => {
        sinon.assert.calledWith(
          runFunctionStub,
          sinon.match
            .has('payload', userpayload)
            .and(sinon.match.has('url', targetUrl))
            .and(sinon.match.has('headers', ['TestHeader']))
            .and(sinon.match.has('structured', true))
            .and(sinon.match.has('targetusername', Config.DEFAULT_USERNAME))
        );
      });
    test
      .stdout()
      .command(['run:function', '-l', targetUrl, '-p', userpayload])
      .it('Should log default username', async (ctx) => {
        expect(ctx.stdout).to.contain(`Using defaultusername ${testData.username} login credential`);
      });

    test
      .stdout()
      .command(['run:function', '-l', targetUrl, '-p', userpayload])
      .it('Should log response', async (ctx) => {
        expect(ctx.stdout).to.contain('Something happened!');
      });
  });
  context('without org or defaultuser', () => {
    process.stdout.isTTY = true;
    process.stderr.isTTY = true;

    test
      .stdout()
      .stderr()
      .command(['run:function', '-l', targetUrl, '-p {"id":12345}'])
      .it('should output the response from the server', (ctx) => {
        expect(ctx.stdout).to.contain('Something happened!');
        expect(ctx.stderr).to.contain('Warning: No -o connected org or defaultusername found');
      });
  });
});
