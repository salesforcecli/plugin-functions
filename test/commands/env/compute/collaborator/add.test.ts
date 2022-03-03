/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import herokuColor from '@heroku-cli/color';

const HEROKU_USER = 'rick@morty.com';

describe('sf env compute collaborator add', () => {
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => api.post('/salesforce-orgs/collaborators').reply(409, {}))
    .command(['env:compute:collaborator:add', '-h', HEROKU_USER])
    .catch((error) => {
      expect(error.message).contains(`Collaborator ${herokuColor.heroku(HEROKU_USER)} has already been added.`);
    })
    .it('alerts user if they already have a specifc user added');

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => api.post('/salesforce-orgs/collaborators').reply(200, {}))
    .command(['env:compute:collaborator:add', '-h', HEROKU_USER])
    .it('connects heroku user to compute environments', (ctx) => {
      expect(ctx.stderr).to.contain(`Adding collaborator ${herokuColor.heroku(HEROKU_USER)} to compute environments.`);
    });

  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => api.post('/salesforce-orgs/collaborators').reply(404, {}))
    .command(['env:compute:collaborator:add', '-h', HEROKU_USER])
    .catch((error) => {
      expect(error.message).contains(`There is no Heroku User under the username ${herokuColor.heroku(HEROKU_USER)}.`);
    })
    .it('alerts user if user entered does not exist');
});
