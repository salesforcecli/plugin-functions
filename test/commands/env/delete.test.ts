/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, test } from '@oclif/test';
import { Org, SfdxProject } from '@salesforce/core';
import { AliasAccessor } from '@salesforce/core/lib/globalInfo';
import * as sinon from 'sinon';
import * as Utils from '../../../src/lib/utils';
import vacuum from '../../helpers/vacuum';
const COMPUTE_ENV_NAME = 'my-new-compute-environment-100';
const COMPUTE_ENV_ALIAS = 'my-compute-alias';

const PROJECT_MOCK = {
  resolveProjectConfig() {
    return PROJECT_CONFIG_MOCK;
  },
};
export const PROJECT_CONFIG_MOCK = {
  name: 'sweet_project',
};

const ORG_MOCK = {
  getUsername: () => 'fakeUsername',
  getConnection: () => {
    return {
      metadata: {
        list: () => {
          return [];
        },
        delete: () => 200,
      },
    };
  },
};

describe('env:delete', () => {
  const sandbox = sinon.createSandbox();

  test
    .stderr()
    .nock('https://api.heroku.com', (api) => api.delete(`/apps/${COMPUTE_ENV_NAME}`).reply(200))
    .nock('https://api.heroku.com', (api) => api.get(`/apps/${COMPUTE_ENV_NAME}`).reply(200))
    .do(() => {
      sandbox.stub(Utils, 'resolveOrg' as any).returns(ORG_MOCK);
      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
    })
    .finally(() => {
      sandbox.restore();
    })
    .command(['env:delete', `--target-compute=${COMPUTE_ENV_NAME}`, `--confirm=${COMPUTE_ENV_NAME}`])
    .it('deletes an environment when providing the name of the compute environment', (ctx) => {
      const output = ctx.stderr;
      expect(output).to.include(`Deleting environment ${COMPUTE_ENV_NAME}... done`);
    });

  test
    .stderr()
    .do(() => {
      sandbox.stub(Utils, 'resolveOrg' as any).returns(ORG_MOCK);
      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(AliasAccessor.prototype, 'getValue').returns(COMPUTE_ENV_NAME);
    })
    .finally(() => {
      sandbox.restore();
    })
    .nock('https://api.heroku.com', (api) => api.delete(`/apps/${COMPUTE_ENV_NAME}`).reply(200))
    .nock('https://api.heroku.com', (api) => api.get(`/apps/${COMPUTE_ENV_NAME}`).reply(200))
    .command(['env:delete', `--target-compute=${COMPUTE_ENV_ALIAS}`, `--confirm=${COMPUTE_ENV_ALIAS}`])
    .it('deletes an environment when providing the valid alias of a compute environment name', (ctx) => {
      const output = ctx.stderr;
      expect(output).to.include(`Deleting environment ${COMPUTE_ENV_ALIAS}... done`);
    });

  test
    .stderr()
    .nock('https://api.heroku.com', (api) => api.delete(`/apps/${COMPUTE_ENV_NAME}`).reply(200))
    .nock('https://api.heroku.com', (api) => api.get(`/apps/${COMPUTE_ENV_NAME}`).reply(200))
    .do(() => {
      sandbox
        .stub(Utils, 'resolveOrg' as any)
        .throws('Attempted to resolve an org without an org ID or target-org value');
    })
    .add('projectResolveStub', () => {
      return sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
    })
    .finally(() => {
      sandbox.restore();
    })
    .command(['env:delete', `--target-compute=${COMPUTE_ENV_NAME}`, `--confirm=${COMPUTE_ENV_NAME}`])
    .it('deletes an environment even if its associated org no longer exists', (ctx) => {
      const output = ctx.stderr;
      expect(output).to.include(`Deleting environment ${COMPUTE_ENV_NAME}... done`);
      // If they're deleting the environment after deleting the org, the command shouldn't attempt
      // to clean up function references, and therefore it shouldn't attempt to resolve the project
      expect(ctx.projectResolveStub).to.not.have.been.called;
    });

  test
    .stderr()
    .nock('https://api.heroku.com', (api) => api.get(`/apps/${COMPUTE_ENV_NAME}`).reply(404))
    .do(() => {
      sandbox.stub(Utils, 'resolveOrg' as any).returns({});
      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(Utils, 'fetchOrg' as any).returns(ORG_MOCK);
    })
    .finally(() => {
      sandbox.restore();
    })
    .command(['env:delete', `--target-compute=${COMPUTE_ENV_NAME}`, `--confirm=${COMPUTE_ENV_NAME}`])
    .catch((error) => {
      expect(error.message).to.contain(
        'Value provided for environment does not match a compute environment name or an alias to a compute environment'
      );
    })
    .it('errors when providing an invalid compute environment name or alias', (ctx) => {
      const output = ctx.stderr;
      expect(output).to.include(`Deleting environment ${COMPUTE_ENV_NAME}... failed`);
    });

  test
    .stderr()
    .do(() => {
      sandbox.stub(Org, 'create' as any).returns({ name: true });
    })
    .finally(() => {
      sandbox.restore();
    })
    .command(['env:delete', `--target-compute=${COMPUTE_ENV_NAME}`, `--confirm=${COMPUTE_ENV_NAME}`])
    .catch((error) => {
      expect(error.message).to.contain(
        `The environment ${COMPUTE_ENV_NAME} is a Salesforce org. The env:delete command currently can only be used to delete compute environments. Please use sfdx force:org:delete to delete scratch and sandbox Salesforce org environments.`
      );
    })
    .it('errors when providing an alias of an org environment', (ctx) => {
      const output = ctx.stderr;
      expect(output).to.include(`Deleting environment ${COMPUTE_ENV_NAME}... failed`);
    });

  test
    .stderr()
    .do(() => {
      sandbox.stub(Utils, 'resolveOrg' as any).returns(ORG_MOCK);
      sandbox.stub(SfdxProject, 'resolve' as any).returns(PROJECT_MOCK);
      sandbox.stub(AliasAccessor.prototype, 'getValue').returns(COMPUTE_ENV_NAME);
    })
    .finally(() => {
      sandbox.restore();
    })
    .nock('https://api.heroku.com', (api) => api.delete(`/apps/${COMPUTE_ENV_NAME}`).reply(200))
    .nock('https://api.heroku.com', (api) => api.get(`/apps/${COMPUTE_ENV_NAME}`).reply(200))
    .command(['env:delete', `--environment=${COMPUTE_ENV_ALIAS}`, `--confirm=${COMPUTE_ENV_ALIAS}`])
    .it('will use a compute environment if passed using the old flag (not --target-compute)', (ctx) => {
      expect(vacuum(ctx.stderr).replace(/\n[›»]/gm, '')).to.contain(
        vacuum(
          '--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.'
        )
      );
    });
});
