/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import { CLIError } from '@oclif/errors';
import { Org, SfdxProject } from '@salesforce/core';
import * as sinon from 'sinon';
import Git from '../../../../src/lib/git';
import { AuthStubs } from '../../../helpers/auth';
import DeployFunctionsCommand from '../../../../src/commands/deploy/functions';
import * as FunctionReferenceUtils from '../../../../src/lib/function-reference-utils';

const sandbox = sinon.createSandbox();

export const PROJECT_CONFIG_MOCK = {
  name: 'sweet_project',
};

const PROJECT_MOCK = {
  resolveProjectConfig() {
    return PROJECT_CONFIG_MOCK;
  },
};

const FUNCTION_REFS_MOCK = [
  {
    fullName: 'sweet_project-fn1',
    label: 'fn1',
    description: 'description',
  },
  {
    fullName: 'sweet_project-fn2',
    label: 'fn2',
    description: 'description',
    access: 'global',
  },
];

const USERNAME = 'fakeusername@salesforce.com';

const METADATA_MOCK = {
  upsert: (type: string, refs: any[]) => {
    return refs.map((ref) => {
      if (ref.fullName.includes('error')) {
        return {
          fullName: ref.fullName,
          success: false,
        };
      }
      return {
        fullName: ref.fullName,
        success: true,
        created: true,
      };
    });
  },
  list: () => {
    return FUNCTION_REFS_MOCK.map((ref) => {
      return {
        fullName: ref.fullName,
      };
    });
  },
  delete: sandbox.stub(),
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
    return {
      metadata: METADATA_MOCK,
    };
  },
};

const ORG_MOCK_WITH_DELETED_FUNCTION = {
  ...ORG_MOCK,
};

ORG_MOCK_WITH_DELETED_FUNCTION.getConnection = function () {
  return {
    metadata: {
      ...METADATA_MOCK,
      list: () => {
        return [
          ...FUNCTION_REFS_MOCK.map((ref) => {
            return {
              fullName: ref.fullName,
            };
          }),
          {
            fullName: 'sweet_project-fn2bedeleted',
          },
          {
            fullName: 'other_sweet_project-fn1',
          },
        ];
      },
    },
  };
};

const ENVIRONMENT_MOCK = {
  id: '1',
  name: 'sweet_project-fn-1',
  sfdx_project_name: PROJECT_CONFIG_MOCK.name,
  sales_org_connection: {
    sales_org_id: ORG_MOCK.id,
    sales_org_stage: 'test',
  },
  git_url: 'https://git.fakeheroku.com/sweet_project',
};

const REMOTE_URL = 'https://login:password@git.fakeheroku.com/sweet_project';

describe('sf project deploy functions', () => {
  // Base Case
  test
    .stdout()
    .stderr()
    .do(() => {
      sandbox.stub(Git.prototype as any, 'hasUnpushedFiles').returns(false);
      sandbox.stub(Git.prototype, 'status' as any).returns('On branch main');
      const gitExecStub = sandbox.stub(Git.prototype, 'exec' as any);
      gitExecStub.withArgs(sinon.match.array.startsWith(['push'])).returns({ stdout: '', stderr: '' });

      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(Org, 'create' as any).returns(ORG_MOCK);

      sandbox.stub(FunctionReferenceUtils, 'resolveFunctionReferences' as any).returns(FUNCTION_REFS_MOCK);
    })
    .finally(() => {
      sandbox.restore();
    })
    .nock('https://api.heroku.com', (api) => {
      api.get(`/sales-org-connections/${ORG_MOCK.id}/apps/${PROJECT_CONFIG_MOCK.name}`).reply(200, ENVIRONMENT_MOCK);
    })
    .command(['deploy:functions', '--connected-org=my-scratch-org'])
    .it('deploys a function', (ctx) => {
      expect(ctx.stdout).to.include('Reference for sweet_project-fn1 created');
      expect(ctx.stdout).to.include('Reference for sweet_project-fn2 created');
      expect(ctx.stdout).to.not.include('Removing the following functions that were deleted locally:');
    });

  // When specifying another branch
  test
    .stdout()
    .stderr()
    .do(() => {
      sandbox.stub(Git.prototype as any, 'hasUnpushedFiles').returns(false);
      sandbox.stub(Git.prototype, 'status' as any).returns('On branch main');

      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(Org, 'create' as any).returns(ORG_MOCK_WITH_DELETED_FUNCTION);

      sandbox.stub(FunctionReferenceUtils, 'resolveFunctionReferences' as any).returns(FUNCTION_REFS_MOCK);
    })
    .add('execStub', () => {
      const gitExecStub = sandbox.stub(Git.prototype, 'exec' as any);
      gitExecStub.withArgs(sinon.match.array.startsWith(['push'])).returns({ stdout: '', stderr: '' });

      return gitExecStub;
    })
    .finally(() => {
      sandbox.restore();
    })
    .nock('https://api.heroku.com', (api) => {
      api.get(`/sales-org-connections/${ORG_MOCK.id}/apps/${PROJECT_CONFIG_MOCK.name}`).reply(200, ENVIRONMENT_MOCK);
    })
    .command(['deploy:functions', '--connected-org=my-scratch-org', '--branch=other-branch'])
    .it('pulls from a different branch when specified', (ctx) => {
      expect(ctx.execStub).to.have.been.calledWith([
        'push',
        'https://login:password@git.fakeheroku.com/sweet_project',
        'other-branch:master',
      ]);
    });

  // when there are functions to delete
  test
    .stdout()
    .stderr()
    .do(() => {
      sandbox.stub(Git.prototype as any, 'hasUnpushedFiles').returns(false);
      sandbox.stub(Git.prototype, 'status' as any).returns('On branch main');
      const gitExecStub = sandbox.stub(Git.prototype, 'exec' as any);
      gitExecStub.withArgs(['push', REMOTE_URL, 'main:master']).returns({ stdout: '', stderr: '' });

      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(Org, 'create' as any).returns(ORG_MOCK_WITH_DELETED_FUNCTION);

      sandbox.stub(FunctionReferenceUtils, 'resolveFunctionReferences' as any).returns(FUNCTION_REFS_MOCK);
    })
    .finally(() => {
      sandbox.restore();
    })
    .nock('https://api.heroku.com', (api) => {
      api.get(`/sales-org-connections/${ORG_MOCK.id}/apps/${PROJECT_CONFIG_MOCK.name}`).reply(200, ENVIRONMENT_MOCK);
    })
    .command(['deploy:functions', '--connected-org=my-scratch-org'])
    .it('clears function references when it finds that a function has been deleted locally', (ctx) => {
      expect(ctx.stdout).to.contain('Removing the following functions that were deleted locally:');
      expect(ctx.stdout).to.contain('sweet_project-fn2bedeleted');

      // Verify that we do not delete function references that belong to other projects
      expect(ctx.stdout).to.not.contain('other_sweet_project-fn1');
    });

  // when there is no login
  test
    .stdout()
    .stderr()
    .do(() => {
      sandbox.stub(Git.prototype as any, 'hasUnpushedFiles').returns(false);
      sandbox.stub(Git.prototype, 'status' as any).returns('On branch main');
      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(Org, 'create' as any).returns(ORG_MOCK);

      AuthStubs.getToken.returns(undefined);

      sandbox.stub(FunctionReferenceUtils, 'resolveFunctionReferences' as any).returns(FUNCTION_REFS_MOCK);
    })
    .add('execStub', () => {
      return sandbox.stub(Git.prototype, 'exec' as any);
    })
    .finally(() => {
      sandbox.restore();
    })
    .command(['deploy:functions', '--connected-org=my-scratch-org'])
    .catch((error) => {
      expect(error.message).to.include('Please login with `sf login functions`');
    })
    .it('errors when there is no login in netrc', (ctx) => {
      expect(ctx.execStub).to.not.have.been.called;
    });

  // force push works for non-prod org
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => {
      api.get(`/sales-org-connections/${ORG_MOCK.id}/apps/${PROJECT_CONFIG_MOCK.name}`).reply(200, ENVIRONMENT_MOCK);
    })
    .do(() => {
      sandbox.stub(Git.prototype as any, 'hasUnpushedFiles').returns(false);
      sandbox.stub(Git.prototype, 'status' as any).returns('On branch main');

      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(Org, 'create' as any).returns(ORG_MOCK);

      sandbox.stub(FunctionReferenceUtils, 'resolveFunctionReferences' as any).returns(FUNCTION_REFS_MOCK);
    })
    .add('execStub', () => {
      const gitExecStub = sandbox.stub(Git.prototype, 'exec' as any);
      gitExecStub.withArgs(sinon.match.array.startsWith(['push'])).returns({ stdout: '', stderr: '' });

      return gitExecStub;
    })
    .finally(() => {
      sandbox.restore();
    })
    .command(['deploy:functions', '--connected-org=my-scratch-org', '--force'])
    .it('will force push when --force is used with a non-production org', (ctx) => {
      expect(ctx.execStub).to.have.been.calledWith([
        'push',
        'https://login:password@git.fakeheroku.com/sweet_project',
        'main:master',
        '--force',
      ]);
    });

  // force push protection for prod org
  test
    .stdout()
    .stderr()
    .nock('https://api.heroku.com', (api) => {
      api.get(`/sales-org-connections/${ORG_MOCK.id}/apps/${PROJECT_CONFIG_MOCK.name}`).reply(200, {
        ...ENVIRONMENT_MOCK,
        sales_org_connection: {
          ...ENVIRONMENT_MOCK.sales_org_connection,
          sales_org_stage: 'prod',
        },
      });
    })
    .do(() => {
      sandbox.stub(Git.prototype as any, 'hasUnpushedFiles').returns(false);
      sandbox.stub(Git.prototype, 'status' as any).returns('On branch main');

      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(Org, 'create' as any).returns(ORG_MOCK);

      sandbox.stub(FunctionReferenceUtils, 'resolveFunctionReferences' as any).returns(FUNCTION_REFS_MOCK);
    })
    .add('execStub', () => {
      const gitExecStub = sandbox.stub(Git.prototype, 'exec' as any);
      gitExecStub.withArgs(sinon.match.array.startsWith(['push'])).returns({ stdout: '', stderr: '' });

      return gitExecStub;
    })
    .finally(() => {
      sandbox.restore();
    })
    .command(['deploy:functions', '--connected-org=my-scratch-org', '--force'])
    .catch((error) => {
      expect(error.message).to.include('You cannot use the `--force` flag with a production org.');
    })
    .it('will not force push when --force is used with a production org', (ctx) => {
      expect(ctx.execStub).to.not.have.been.called;
    });

  // When using API key
  test
    .stdout()
    .stderr()
    .env({
      SALESFORCE_FUNCTIONS_API_KEY: '12345',
    })
    .do(() => {
      sandbox.stub(Git.prototype as any, 'hasUnpushedFiles').returns(false);
      sandbox.stub(Git.prototype, 'status' as any).returns('On branch main');
      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(Org, 'create' as any).returns(ORG_MOCK);

      sandbox.stub(FunctionReferenceUtils, 'resolveFunctionReferences' as any).returns(FUNCTION_REFS_MOCK);
      sandbox.stub(DeployFunctionsCommand.prototype, 'username' as any).returns(undefined);
    })
    .add('execStub', () => {
      const gitExecStub = sandbox.stub(Git.prototype, 'exec' as any);
      gitExecStub.withArgs(sinon.match.array.startsWith(['push'])).returns({ stdout: '', stderr: '' });

      return gitExecStub;
    })
    .finally(() => {
      sandbox.restore();
    })
    .nock('https://api.heroku.com', (api) => {
      api.get(`/sales-org-connections/${ORG_MOCK.id}/apps/${PROJECT_CONFIG_MOCK.name}`).reply(200, ENVIRONMENT_MOCK);
    })
    .command(['deploy:functions', '--connected-org=my-scratch-org'])
    .it('generates the correct remote when passing an API key', (ctx) => {
      expect(ctx.execStub).to.have.been.calledWith([
        'push',
        'https://:12345@git.fakeheroku.com/sweet_project',
        'main:master',
      ]);
    });

  // quiet mode
  test
    .stdout()
    .stderr()
    .do(() => {
      sandbox.stub(Git.prototype as any, 'hasUnpushedFiles').returns(false);
      sandbox.stub(Git.prototype, 'status' as any).returns('On branch main');
      const gitExecStub = sandbox.stub(Git.prototype, 'exec' as any);
      gitExecStub.withArgs(sinon.match.array.startsWith(['push'])).returns({ stdout: 'STDOUT', stderr: 'STDERR' });

      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(Org, 'create' as any).returns(ORG_MOCK);

      sandbox.stub(FunctionReferenceUtils, 'resolveFunctionReferences' as any).returns(FUNCTION_REFS_MOCK);
    })
    .finally(() => {
      sandbox.restore();
    })
    .nock('https://api.heroku.com', (api) => {
      api.get(`/sales-org-connections/${ORG_MOCK.id}/apps/${PROJECT_CONFIG_MOCK.name}`).reply(200, ENVIRONMENT_MOCK);
    })
    .command(['deploy:functions', '--connected-org=my-scratch-org', '--quiet'])
    .it('does not print stdout in quiet mode', (ctx) => {
      expect(ctx.stdout).to.not.include('STDOUT');
    });

  // With errors
  test
    .stdout()
    .stderr()
    .do(() => {
      sandbox.stub(Git.prototype as any, 'hasUnpushedFiles').returns(false);
      sandbox.stub(Git.prototype, 'status' as any).returns('On branch main');
      const gitExecStub = sandbox.stub(Git.prototype, 'exec' as any);
      gitExecStub.withArgs(sinon.match.array.startsWith(['push'])).returns({ stdout: '', stderr: '' });

      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(Org, 'create' as any).returns(ORG_MOCK);
      sandbox.stub(FunctionReferenceUtils, 'resolveFunctionReferences' as any).returns([
        ...FUNCTION_REFS_MOCK,
        {
          fullName: 'sweet_project-fnerror',
          label: 'fnerror',
          description: 'description',
        },
      ]);
    })
    .finally(() => {
      sandbox.restore();
    })
    .nock('https://api.heroku.com', (api) => {
      api.get(`/sales-org-connections/${ORG_MOCK.id}/apps/${PROJECT_CONFIG_MOCK.name}`).reply(200, ENVIRONMENT_MOCK);
    })
    .command(['deploy:functions', '--connected-org=my-scratch-org'])
    .catch((error) => {
      expect((error as CLIError).oclif.exit).to.equal(1);
    })
    .it('exits non-zero but continues deploying when one of your function references fails', (ctx) => {
      expect(ctx.stdout).to.include('Reference for sweet_project-fn1 created');
      expect(ctx.stdout).to.include('Reference for sweet_project-fn2 created');
      expect(ctx.stderr).to.include('Unable to deploy FunctionReference for sweet_project-fnerror.');
      expect(ctx.stderr).to.not.include('Reference for sweet_project-fnerror created');
    });
});
