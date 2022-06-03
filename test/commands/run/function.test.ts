/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import { Config, OrgConfigProperties } from '@salesforce/core';
import { cli } from 'cli-ux';

import { MockTestOrgData, testSetup } from '@salesforce/core/lib/testSetup';
import * as sinon from 'sinon';

import * as library from '@hk/functions-core';
import vacuum from '../../helpers/vacuum';

describe('run:function', () => {
  const $$ = testSetup();
  const targetUrl = 'http://localhost';
  const userpayload = '{"id":654321,"field1":"somefield"}';
  let testData: MockTestOrgData;
  let sandbox: sinon.SinonSandbox;
  let runFunctionStub: sinon.SinonStub;
  let stopActionSub: sinon.SinonStub;
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    runFunctionStub = sandbox.stub(library, 'runFunction');
    runFunctionStub.returns({
      headers: { 'content-type': 'application/json; charset=utf-8' },
      data: 'Something happened!',
      status: 200,
    });
    stopActionSub = sandbox.stub(cli.action, 'stop');
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
      await $$.stubAuths(testData);
      const config = await Config.create(Config.getDefaultOptions(true));
      config.set(OrgConfigProperties.TARGET_ORG, testData.username);
      await config.write();
    });

    test
      .stdout()
      .stderr()
      .command(['run:function', '-l', targetUrl, '-p', userpayload])
      .it(`Should call the library with payload ${userpayload}`, async () => {
        sinon.assert.calledWith(
          runFunctionStub,
          sinon.match.has('payload', userpayload).and(sinon.match.has('function-url', targetUrl))
        );
      });
    test
      .stdout()
      .stderr()
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
        OrgConfigProperties.TARGET_ORG,
      ])
      .it('Should call the library with all arguments', async () => {
        sinon.assert.calledWith(
          runFunctionStub,
          sinon.match
            .has('payload', userpayload)
            .and(sinon.match.has('function-url', targetUrl))
            .and(sinon.match.has('headers', ['TestHeader']))
            .and(sinon.match.has('structured', true))
            .and(sinon.match.has('targetusername', OrgConfigProperties.TARGET_ORG))
        );
      });
    test
      .stdout()
      .stderr()
      .command(['run:function', '-l', targetUrl, '-p', userpayload])
      .it('Should log target org', async (ctx) => {
        expect(ctx.stdout).to.contain(`Using target-org ${testData.username} login credential`);
      });

    test
      .stderr()
      .command(['run:function', '--url', targetUrl, '-p', userpayload])
      .it('will use url if passed using the old flag (not --function-url)', (ctx) => {
        expect(vacuum(ctx.stderr).replace(/\n[›»]/gm, '')).to.contain(
          vacuum(
            '--url is deprecated and will be removed in a future release. Please use --function-url going forward.'
          )
        );
      });

    test
      .stdout()
      .stderr()
      .command(['run:function', '-l', targetUrl, '-p', userpayload])
      .it('Should log response', async (ctx) => {
        expect(ctx.stdout).to.contain('Something happened!');
      });
    test
      .command(['run:function', '-l', targetUrl, '-p', userpayload])
      .it('Should stop spinner and display status code', async () => {
        sinon.assert.calledWith(stopActionSub, sinon.match('200'));
      });
  });

  context('with failed response', () => {
    beforeEach(async () => {
      runFunctionStub.rejects({
        response: {
          headers: { 'content-type': 'application/json; charset=utf-8' },
          data: 'Something bad happened!',
          status: 500,
        },
      });
    });

    test
      .stdout()
      .stderr()
      .stub(process, 'exit', () => '')
      .command(['run:function', '-l', targetUrl, '-p', userpayload])
      .catch((error) => expect(error.message).to.contain('Something bad happened!'))
      .finally(() => {
        sinon.assert.calledWith(stopActionSub, sinon.match('500'));
      })
      .it('Should log response and stop spinner with status code');
  });

  context('with failure and no response', () => {
    const errorMessage = 'Something unknown happened';
    beforeEach(async () => {
      runFunctionStub.rejects(new Error(errorMessage));
    });

    test
      .stdout()
      .stderr()
      .stub(process, 'exit', () => '')
      .command(['run:function', '-l', targetUrl, '-p', userpayload])
      .catch((error) => expect(error.message).to.contain(errorMessage))
      .finally(() => {
        sinon.assert.calledWith(stopActionSub, sinon.match('Error'));
      })
      .it('Should log error and stop spinner with status code');
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
        expect(ctx.stderr).to.contain('Warning: No -o connected org or target-org found');
      });
  });
});
