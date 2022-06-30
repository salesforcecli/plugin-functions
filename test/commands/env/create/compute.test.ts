/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import { Org, SfProject } from '@salesforce/core';
import { AliasAccessor } from '@salesforce/core/lib/stateAggregator';
import * as sinon from 'sinon';
import { AuthStubs } from '../../../helpers/auth';

const APP_MOCK = {
  id: '1',
  name: 'sweet-project-1',
};

const USERNAME = 'fakeusername@salesforce.com';

const CONN_MOCK = {
  metadata: {
    list: sinon.stub(),
  },
  query: sinon.stub().returns({
    records: [
      {
        Status: 'TrustedBiDirection',
      },
    ],
  }),
};

const ORG_MOCK = {
  id: '1',
  getOrgId() {
    return '1';
  },
  getUsername() {
    return USERNAME;
  },
  getConnection() {
    return CONN_MOCK;
  },
};

const PROJECT_CONFIG_MOCK = {
  name: 'sweet_project',
};

const PROJECT_MOCK = {
  resolveProjectConfig() {
    return PROJECT_CONFIG_MOCK;
  },
};

const PROJECT_MOCK_NO_NAME = {
  resolveProjectConfig() {
    return {};
  },
};

const ORG_ALIAS = 'my-cool-alias';
const ENVIRONMENT_ALIAS = 'my-cool-environment';

const jsonSuccess = {
  status: 0,
  result: {
    alias: ENVIRONMENT_ALIAS,
    projectName: PROJECT_CONFIG_MOCK.name,
    connectedOrgAlias: '',
    connectedOrgId: ORG_MOCK.id,
    computeEnvironmentName: APP_MOCK.name,
  },
  warnings: [],
};

describe('sf env create compute', () => {
  const sandbox = sinon.createSandbox();

  test
    .stdout()
    .stderr()
    .retries(3)
    .do(() => {
      sandbox.stub(Org, 'create' as any).returns(ORG_MOCK);
      sandbox.stub(SfProject, 'resolve' as any).returns(PROJECT_MOCK);
    })
    .finally(() => {
      sandbox.restore();
    })
    .nock('https://api.heroku.com', (api) => {
      api
        .post(`/sales-org-connections/${ORG_MOCK.id}/apps`, {
          sfdx_project_name: PROJECT_CONFIG_MOCK.name,
        })
        .reply(200, APP_MOCK)
        .get(`/sales-org-connections/${ORG_MOCK.id}/apps/${PROJECT_CONFIG_MOCK.name}`)
        .reply(200, APP_MOCK);
    })
    .command(['env:create:compute'])
    .it('creates a compute environment using the default org and project when no flags are passed', (ctx) => {
      expect(ctx.stderr).to.contain(`Creating compute environment for org ID ${ORG_MOCK.id}`);
      expect(ctx.stdout).to.contain(`New compute environment created with ID ${APP_MOCK.name}`);
      expect(ctx.stdout).to.contain('Your compute environment is ready');
    });

  let orgStub: any;

  const aliasSetSpy = sandbox.spy();
  const aliasWriteSpy = sandbox.spy();
  // const setAliasSpy = sandbox.spy();

  test
    .stdout()
    .stderr()
    .retries(3)
    .do(() => {
      orgStub = sandbox.stub(Org, 'create' as any).returns(ORG_MOCK);
      sandbox.stub(SfProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(AliasAccessor.prototype, 'set' as any).callsFake(aliasSetSpy);
      AuthStubs.aliasesWrite.callsFake(aliasWriteSpy);
    })
    .finally(() => {
      sandbox.restore();
    })
    .nock('https://api.heroku.com', (api) => {
      api
        .post(`/sales-org-connections/${ORG_MOCK.id}/apps`, {
          sfdx_project_name: PROJECT_CONFIG_MOCK.name,
        })
        .reply(200, APP_MOCK)
        .get(`/sales-org-connections/${ORG_MOCK.id}/apps/${PROJECT_CONFIG_MOCK.name}`)
        .reply(200, APP_MOCK);
    })
    .command(['env:create:compute', '-o', `${ORG_ALIAS}`, '-a', `${ENVIRONMENT_ALIAS}`])
    .it('creates a compute environment and sets an alias using values passed in flags', (ctx) => {
      expect(ctx.stderr).to.contain(`Creating compute environment for org ID ${ORG_MOCK.id}`);
      expect(ctx.stdout).to.contain(`New compute environment created with ID ${APP_MOCK.name}`);
      expect(ctx.stdout).to.contain(`Your compute environment with local alias ${ENVIRONMENT_ALIAS} is ready`);
      expect(orgStub).to.have.been.calledWith({ aliasOrUsername: ORG_ALIAS });
      expect(aliasSetSpy).to.have.been.calledWith(ENVIRONMENT_ALIAS, APP_MOCK.id);
      expect(aliasWriteSpy).to.have.been.called;
    });

  test
    .stdout()
    .stderr()
    .retries(3)
    .do(() => {
      orgStub = sandbox.stub(Org, 'create' as any).returns(ORG_MOCK);
      sandbox.stub(SfProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(AliasAccessor.prototype, 'set' as any).callsFake(aliasSetSpy);
      AuthStubs.aliasesWrite.callsFake(aliasWriteSpy);
    })
    .finally(() => {
      sandbox.restore();
    })
    .nock('https://api.heroku.com', (api) => {
      api
        .post(`/sales-org-connections/${ORG_MOCK.id}/apps`, {
          sfdx_project_name: PROJECT_CONFIG_MOCK.name,
        })
        .reply(200, APP_MOCK)
        .get(`/sales-org-connections/${ORG_MOCK.id}/apps/${PROJECT_CONFIG_MOCK.name}`)
        .reply(200, APP_MOCK);
    })
    .command(['env:create:compute', '-o', `${ORG_ALIAS}`, '-a', `${ENVIRONMENT_ALIAS}`, '-j'])
    .it('will show json output with success', (ctx) => {
      const succJSON = JSON.parse(ctx.stdout);

      expect(succJSON.status).to.deep.equal(jsonSuccess.status);
      expect(succJSON.result).to.eql(jsonSuccess.result);
    });

  test
    .stdout()
    .stderr()
    .do(() => {
      orgStub = sandbox.stub(Org, 'create' as any).returns(ORG_MOCK);
      sandbox.stub(SfProject, 'resolve' as any).returns(PROJECT_MOCK_NO_NAME);
    })
    .finally(() => {
      sandbox.restore();
    })
    .command(['env:create:compute'])
    .catch((error) => {
      expect(error.message).to.contain('No project name found in sfdx-project.json');
    })
    .it('errors out when project name is not present');

  test
    .stdout()
    .stderr()
    .do(() => {
      orgStub = sandbox.stub(Org, 'create' as any).returns(ORG_MOCK);
      sandbox.stub(SfProject, 'resolve' as any).returns(PROJECT_MOCK);
    })
    .finally(() => {
      sandbox.restore();
    })
    .nock('https://api.heroku.com', (api) => {
      api
        .post(`/sales-org-connections/${ORG_MOCK.id}/apps`, {
          sfdx_project_name: PROJECT_CONFIG_MOCK.name,
        })
        .reply(422, {
          message: 'Sfdx project name There is already a project with the same name in the same namespace for this org',
        })
        .get(`/sales-org-connections/${ORG_MOCK.id}/apps/${PROJECT_CONFIG_MOCK.name}`)
        .reply(200, APP_MOCK);
    })
    .command(['env:create:compute'])
    .catch((error) => {
      expect(error.message).to.contain('This org is already connected to a compute environment for this project');
    })
    .it('displays an informative error message when environment already exists for a given project');

  test
    .stdout()
    .stderr()
    .do(() => {
      orgStub = sandbox.stub(Org, 'create' as any).returns(ORG_MOCK);
      sandbox.stub(SfProject, 'resolve' as any).returns(PROJECT_MOCK);
    })
    .finally(() => {
      sandbox.restore();
    })
    .nock('https://api.heroku.com', (api) => {
      api
        .post(`/sales-org-connections/${ORG_MOCK.id}/apps`, {
          sfdx_project_name: PROJECT_CONFIG_MOCK.name,
        })
        .reply(422, {
          message:
            "Sfdx project name may only contain numbers (0-9), letters (a-z A-Z) and non-consecutive underscores ('_'). It must begin with a letter and end with either a number or letter.",
        });
    })
    .command(['env:create:compute'])
    .catch((error) => {
      expect(error.message).to.contain(
        "Project name may only contain numbers (0-9), letters (a-z A-Z) and non-consecutive underscores ('_'). It must begin with a letter and end with either a number or letter"
      );
    })
    .it('displays an informative error message when the project name is invalid');

  test
    .stdout()
    .stderr()
    .retries(3)
    .do(() => {
      sandbox.stub(SfProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(AliasAccessor.prototype, 'set' as any).callsFake(aliasSetSpy);
      AuthStubs.aliasesWrite.callsFake(aliasWriteSpy);
    })
    .add('queryStub', () => {
      const queryStub = sinon.stub();
      queryStub
        .withArgs(sinon.match('SfFunctionsConnection'))
        .throws({ message: "sObject type 'SfFunctionsConnection' is not supported." });

      queryStub.withArgs(sinon.match('FunctionConnection')).returns({
        records: [
          {
            Status: 'TrustedBiDirection',
          },
        ],
      });
      orgStub = sandbox.stub(Org, 'create' as any).returns({
        ...ORG_MOCK,
        getConnection() {
          return {
            metadata: {
              list: sinon.stub(),
            },
            query: queryStub,
          };
        },
      });

      return queryStub;
    })
    .finally(() => {
      sinon.restore();
      sandbox.restore();
    })
    .nock('https://api.heroku.com', (api) => {
      api
        .post(`/sales-org-connections/${ORG_MOCK.id}/apps`, {
          sfdx_project_name: PROJECT_CONFIG_MOCK.name,
        })
        .reply(200, APP_MOCK)
        .get(`/sales-org-connections/${ORG_MOCK.id}/apps/${PROJECT_CONFIG_MOCK.name}`)
        .reply(200, APP_MOCK);
    })
    .command(['env:create:compute', '-o', `${ORG_ALIAS}`, '-a', `${ENVIRONMENT_ALIAS}`])
    .it('still creates a compute env even if SfFunctionsConnection is not supported', (ctx) => {
      expect(ctx.stderr).to.contain(`Creating compute environment for org ID ${ORG_MOCK.id}`);
      expect(ctx.stdout).to.contain(`New compute environment created with ID ${APP_MOCK.name}`);
      expect(ctx.stdout).to.contain(`Your compute environment with local alias ${ENVIRONMENT_ALIAS} is ready`);
      expect(orgStub).to.have.been.calledWith({ aliasOrUsername: ORG_ALIAS });
      expect(aliasSetSpy).to.have.been.calledWith(ENVIRONMENT_ALIAS, APP_MOCK.id);
      expect(aliasWriteSpy).to.have.been.called;
      // This is the assertion we rally care about for this test. We want to verify that everything proceeds
      // as normal even if the first query errors because we're using the old object type
      expect(ctx.queryStub).to.have.been.calledTwice;
    });

  test
    .stdout()
    .stderr()
    .do(() => {
      orgStub = sandbox.stub(Org, 'create' as any).returns(ORG_MOCK);
      sandbox.stub(SfProject, 'resolve' as any).returns(PROJECT_MOCK);
      CONN_MOCK.metadata.list = sinon.stub().throws('INVALID_TYPE');
    })
    .finally(() => {
      sandbox.restore();
      sinon.restore();
    })
    .command(['env:create:compute'])
    .catch((error) => {
      expect(error.message).to.contain(
        'The org you are attempting to create a compute environment for does not have the Functions feature enabled.'
      );
    })
    .it("displays an informative error message if the org doesn't have functions enabled");
});
