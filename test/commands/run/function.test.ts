/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import { Config } from '@salesforce/core';
import { MockTestOrgData, testSetup } from '@salesforce/core/lib/testSetup';
import { HTTP } from 'cloudevents';
import * as deepEqual from 'fast-deep-equal/es6';
import * as sinon from 'sinon';
import * as installBenny from '../../../src/install-benny';

describe('run:function', () => {
  const $$ = testSetup();
  const targetUrl = 'http://localhost';
  const userpayload = '{"id":654321,"field1":"somefield"}';
  let testData: MockTestOrgData;
  let sandbox: sinon.SinonSandbox;
  let bennyStub: any;

  const matchesSfcontext = (val?: string): boolean => {
    if (!val) {
      return false;
    }
    // CloudEvents 1.0 `sfcontext` extension must be base64-encoded JSON-serialized object
    const sfcontext = JSON.parse(Buffer.from(val, 'base64').toString('utf-8'));

    return (
      sfcontext.apiVersion !== null &&
      sfcontext.userContext.username === testData.username &&
      sfcontext.userContext.orgId === testData.orgId.slice(0, 18) &&
      sfcontext.userContext.salesforceBaseUrl === testData.instanceUrl
    );
  };

  const matchesSffncontext = (val?: string): boolean => {
    // CloudEvents 1.0 `sffncontext` extension must be base64-encoded JSON-serialized object
    if (!val) {
      return false;
    }
    const sffncontext = JSON.parse(Buffer.from(val, 'base64').toString('utf-8'));

    return sffncontext.accessToken === testData.accessToken;
  };

  const hasSfdcData = (body: any): boolean => {
    const userpayloadobj = JSON.parse(userpayload);
    let payload: any;
    let matchesContext = true;

    // If given a structured json cloudevent will have `specversion` toplevel key
    if ('specversion' in body) {
      payload = body.data;
      matchesContext = matchesSfcontext(body.sfcontext) && matchesSffncontext(body.sffncontext);
    } else {
      // Otherwise body will ONLY be customer payload
      payload = body;
    }
    return payload.id === userpayloadobj.id && payload.field1 === userpayloadobj.field1 && matchesContext;
  };

  const matchesStructuredCloudEventDataString = (body: any, shouldMatch: string): boolean => {
    // Make sure we can parse input body as structured json CloudEvent and then match data as *string*
    if (body.specversion && body.source) {
      const headers = { 'Content-Type': 'application/cloudevents+json; charset=utf-8' };
      const ce = HTTP.toEvent({ headers, body });
      return ce.data === shouldMatch;
    }
    return false;
  };

  const matchesStructuredCloudEventDataObject = (body: any, shouldMatch: object): boolean => {
    // Make sure we can parse input body as structured json CloudEvent and then deep match data as *object*
    if (body.specversion && body.source) {
      const headers = { 'Content-Type': 'application/cloudevents+json; charset=utf-8' };
      const ce = HTTP.toEvent({ headers, body });
      return deepEqual(shouldMatch, ce.data);
    }
    return false;
  };

  const matchesHttpBinaryCloudEventDataObject = (body: any, shouldMatch: object): boolean => {
    // Make sure we can parse input body as structured json CloudEvent and then deep match data as *object*
    const headers = {
      'ce-specversion': '1.0',
      'ce-id': 'id:12345',
      'ce-type': 'com.evergreen.functions.test',
      'ce-source': 'urn:event:from:local',
      'Content-Type': 'application/json; charset=utf-8',
    };
    const ce = HTTP.toEvent({ headers, body });
    return deepEqual(shouldMatch, ce.data);
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    bennyStub = sandbox.stub(installBenny, 'updateBenny');
  });

  afterEach(() => {
    sandbox.restore();
  });

  context.skip('without a url', () => {
    test.command(['run:function']).exit(2).it('should exit with an error code');

    test.command(['run:function']).catch(/url/).it('should mention the missing argument');
  });

  context('without payload', () => {
    process.stdin.isTTY = true;
    test
      .command(['run:function', '-u', targetUrl])
      .catch(/payload/)
      .it('should mention the missing payload');
  });

  context('with payload', () => {
    beforeEach(async () => {
      testData = new MockTestOrgData();
      $$.configStubs.AuthInfoConfig = { contents: await testData.getConfig() };

      const config: Config = await Config.create(Config.getDefaultOptions(true));
      await config.set(Config.DEFAULT_USERNAME, testData.username);
      await config.write();
    });

    test
      .nock(targetUrl, (fn) => fn.post('/').reply(200, { result: true }))
      .command(['run:function', '-u', targetUrl, '-p {"id":12345}'])
      .it('should run successfully');

    test
      .nock(targetUrl, (fn) => fn.post('/').reply(200, { result: true }))
      .stdout()
      .command(['run:function', '-u', targetUrl, '-p {"id":12345}'])
      .it('should attempt to update benny to the latest version', () => {
        sinon.assert.calledOnce(bennyStub);
      });

    test
      .nock(targetUrl, (fn) => fn.post('/').reply(200, { result: true }))
      .stdout()
      .command(['run:function', '-u', targetUrl, '-p {"id":12345}'])
      .it('should output the response from the server', (ctx) => {
        expect(ctx.stdout).to.contain('"result": true');
        expect(ctx.stdout).to.contain(`Using defaultusername ${testData.username} login credential`);
      });

    test
      .nock(targetUrl, (fn) =>
        fn.post('/').matchHeader('requestid', '1234').matchHeader('fail', 'true').reply(200, { result: true })
      )
      .stdout()
      .command(['run:function', '-u', targetUrl, '-p hi', '-Hrequestid:1234', '-Hfail:true'])
      .it('should forward custom headers', (ctx) => {
        // nock will not match the request if the headers are not correct
        expect(ctx.stdout).to.contain('"result": true');
        expect(ctx.stdout).to.contain(`Using defaultusername ${testData.username} login credential`);
      });

    test
      .nock(targetUrl, (fn) => {
        fn.post('/')
          .matchHeader('content-type', 'application/json; charset=utf-8')
          .matchHeader('ce-subject', 'test-subject')
          .matchHeader('ce-type', 'com.evergreen.functions.test')
          .matchHeader('ce-specversion', '1.0')
          .matchHeader('ce-source', 'urn:event:from:local')
          .matchHeader('ce-id', (v) => v !== null)
          .matchHeader('ce-time', (v) => v !== null)
          .reply(200, { result: true });
      })
      .stdout()
      .command(['run:function', '-u', targetUrl, '-p hi'])
      .it('should have cloudevent headers', (ctx) => {
        // nock will not match the request if the headers are not correct
        expect(ctx.stdout).to.contain('"result": true');
      });

    test
      .nock(targetUrl, (fn) =>
        fn
          .post('/', (body) => matchesStructuredCloudEventDataString(body, ' 12345'))
          .matchHeader('content-type', 'application/cloudevents+json; charset=utf-8')
          .reply(200, { result: true })
      )
      .stdout()
      .command(['run:function', '-u', targetUrl, '-p 12345', '--structured'])
      .it('should send string " 12345" as application/cloudevents+json', (ctx) => {
        // nock will not match the request if the headers are not correct
        expect(ctx.stdout).to.contain('"result": true');
      });

    test
      .nock(targetUrl, (fn) =>
        fn
          .post('/', (body) => matchesStructuredCloudEventDataString(body, ' [not really json'))
          .matchHeader('content-type', 'application/cloudevents+json; charset=utf-8')
          .reply(200, { result: true })
      )
      .stdout()
      .command(['run:function', '-u', targetUrl, '-p [not really json', '--structured'])
      .it('should send string " [not really json" as application/cloudevents+json', (ctx) => {
        // nock will not match the request if the headers are not correct
        expect(ctx.stdout).to.contain('"result": true');
      });

    test
      .nock(targetUrl, (fn) =>
        fn
          .post('/', (body) => matchesStructuredCloudEventDataObject(body, { b: 'x', a: 1 }))
          .matchHeader('content-type', 'application/cloudevents+json; charset=utf-8')
          .reply(200, { result: true })
      )
      .stdout()
      .command(['run:function', '-u', targetUrl, '-p {"a":1,"b":"x"}', '--structured'])
      .it('should send object as application/cloudevents+json', (ctx) => {
        // nock will not match the request if the headers are not correct
        expect(ctx.stdout).to.contain('"result": true');
      });

    test
      .nock(targetUrl, (fn) =>
        fn
          .post('/', (body) => {
            // cloud events returns an object containing `type: "Buffer"` and a data field containing the
            // actual buffer value, so we have to convert it back and compare here
            return Buffer.from('" 12345"').equals(Buffer.from(body.data));
          }) /* should be JSON-quoted to preserve space */
          .matchHeader('content-type', 'application/json; charset=utf-8')
          .reply(200, { result: true })
      )
      .stdout()
      .command(['run:function', '-u', targetUrl, '-p 12345'])
      .it('should send string " 12345" as body with HTTPBinary transport', (ctx) => {
        // nock will not match the request if the headers are not correct
        expect(ctx.stdout).to.contain('"result": true');
      });

    test
      .nock(targetUrl, (fn) =>
        fn
          .post('/', (body) => {
            return Buffer.from('" [not really json"').equals(Buffer.from(body.data));
          }) /* should be JSON-quoted to preserve space/backslash */
          .matchHeader('content-type', 'application/json; charset=utf-8')
          .reply(200, { result: true })
      )
      .stdout()
      .command(['run:function', '-u', targetUrl, '-p [not really json'])
      .it('should send string " [not really json" with HTTPBinary transport', (ctx) => {
        // nock will not match the request if the headers are not correct
        expect(ctx.stdout).to.contain('"result": true');
      });

    test
      .nock(targetUrl, (fn) =>
        fn
          .post('/', (body) => matchesHttpBinaryCloudEventDataObject(body, { b: 'x', a: 1 }))
          .matchHeader('content-type', 'application/json; charset=utf-8')
          .reply(200, { result: true })
      )
      .stdout()
      .command(['run:function', '-u', targetUrl, '-p {"a":1,"b":"x"}'])
      .it('should send object with HTTPBinary transport', (ctx) => {
        // nock will not match the request if the headers are not correct
        expect(ctx.stdout).to.contain('"result": true');
      });

    test
      .nock(targetUrl, (fn) =>
        fn
          .post('/')
          .matchHeader('X-Request-Id', (v) => v !== null)
          .matchHeader('ce-id', (v) => v !== null)
          .reply(200, { result: true })
      )
      .stdout()
      .command(['run:function', '-u', targetUrl, '-p hi'])
      .it('should have X-Request-Id header', (ctx) => {
        // nock will not match the request if the headers are not correct
        expect(ctx.stdout).to.contain('"result": true');
      });
  });

  context('without org or defaultuser', () => {
    process.stdout.isTTY = true;
    process.stderr.isTTY = true;

    test
      .nock(targetUrl, (fn) => fn.post('/').reply(200, { result: true }))
      .stdout()
      .stderr()
      .command(['run:function', '-u', targetUrl, '-p {"id":12345}'])
      .it('should output the response from the server', (ctx) => {
        expect(ctx.stdout).to.contain('"result": true');
        expect(ctx.stderr).to.contain('Warning: No -t targetusername or defaultusername found');
      });
  });

  context('with targetuser for scratch org', () => {
    beforeEach(async () => {
      testData = new MockTestOrgData();
      $$.configStubs.AuthInfoConfig = { contents: await testData.getConfig() };
    });

    test
      .nock(targetUrl, (fn) =>
        fn
          .post('/', (body) => hasSfdcData(body))
          .matchHeader('X-Request-Id', (v) => v !== null)
          .matchHeader('content-type', 'application/cloudevents+json; charset=utf-8')
          .reply(200, { result: true })
      )
      .stdout()
      .command(['run:function', '-u', targetUrl, `-p ${userpayload}`, '-t', 'sorg1', '--structured'])
      .it('cloudEvent body should have sfdc fields set --structured', (ctx) => {
        // nock will not match the request if the headers are not correct
        expect(ctx.stdout).to.contain('"result": true');
        expect(ctx.stdout).to.contain('Using sorg1 login credential');
      });

    test
      .nock(targetUrl, (fn) =>
        fn
          .post('/', (body) => hasSfdcData(body))
          .matchHeader('X-Request-Id', (v) => v !== null)
          .matchHeader('content-type', 'application/json; charset=utf-8')
          .matchHeader('ce-sfcontext', (v) => matchesSfcontext(v))
          .matchHeader('ce-sffncontext', (v) => matchesSffncontext(v))
          .reply(200, { result: true })
      )
      .stdout()
      .command(['run:function', '-u', targetUrl, `-p ${userpayload}`, '-t sorg1'])
      .it('cloudEvent body and ce-sf*context headers should have sfdc fields set', (ctx) => {
        // nock will not match the request if the headers are not correct
        expect(ctx.stdout).to.contain('"result": true');
      });

    test
      .nock(targetUrl, (fn) =>
        fn
          .post('/', (body) => hasSfdcData(body))
          .matchHeader('X-Request-Id', (v) => v !== null)
          .matchHeader('content-type', 'application/json; charset=utf-8')
          .matchHeader('ce-sfcontext', (v) => matchesSfcontext(v))
          .matchHeader('ce-sffncontext', (v) => matchesSffncontext(v))
          .reply(200, { result: true })
      )
      .stdout()
      .command(['run:function', '-u', targetUrl, `-p ${userpayload}`, '-t sorg1'])
      .it('should attempt to update benny to the latest version', () => {
        sinon.assert.calledOnce(bennyStub);
      });
  });
});
