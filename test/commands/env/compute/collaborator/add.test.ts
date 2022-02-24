/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import type { GlobalInfo, SfTokens } from '@salesforce/core';
import herokuColor from '@heroku-cli/color';
import vacuum from '../../../../helpers/vacuum';
import { AuthStubs } from '../../../../helpers/auth';

const HEROKU_USER = 'rick@morty.com';

describe('sf env compute collaborator add', () => {
  let contents: SfTokens;

  beforeEach(() => {
    AuthStubs.write.callsFake(async function (this: GlobalInfo) {
      contents = this.tokens.getAll(true);
      return this.getContents();
    });
  });

  //   test
  //     .stdout()
  //     .stderr()
  //     .command(['logout:functions'])
  //     .it('removes the functions key from the tokens field on logout', (ctx) => {
  //       sinon.assert.match(contents, contents);
  //     });

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => api.post('/salesforce-orgs/collaborators').reply(200, {}))
    .command(['env:compute:collaborator:add', '-h', HEROKU_USER])
    .it('connects heroku user to compute environments', (ctx) => {
      expect(ctx.stderr).to.contain(`Adding collaborator ${herokuColor.heroku(HEROKU_USER)} to compute environments.`);
      // write test to make sure that network requst functionw as called
    });

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => api.post('/salesforce-orgs/collaborators').reply(409, {}))
    .command(['env:compute:collaborator:add', '-h', HEROKU_USER])
    .retries(2)
    .it('alerts user if they already have a specifc user added', (ctx) => {
      expect(ctx.stderr).to.contain(`Collaborator ${herokuColor.heroku(HEROKU_USER)} has already been added.`);
    });

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => api.post('/salesforce-orgs/collaborators').reply(404, {}))
    .command(['env:compute:collaborator:add', '-h', HEROKU_USER])
    .it('alerts user if user entered does not exist', (ctx) => {
      expect(ctx.stderr).to.contain(`There is no Heroku User under the username ${herokuColor.heroku(HEROKU_USER)}.`);
    });
});
