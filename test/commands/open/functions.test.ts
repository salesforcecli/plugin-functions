/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import { cli } from 'cli-ux';
import * as sinon from 'sinon';

describe('sf open functions', () => {
  let windowOpenStub: any;

  beforeEach(() => {
    windowOpenStub = sinon.stub();
  });

  test
    .stdout()
    .stderr()
    .stub(cli, 'open', () => windowOpenStub)
    .command(['open:functions'])
    .it('can open the browser', (ctx) => {
      expect(windowOpenStub.firstCall.args[0]).to.equal('https://platform.salesforce.com/functions');
    });
});
