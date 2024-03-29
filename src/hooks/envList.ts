/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SfHook, EnvList } from '@salesforce/sf-plugins-core';
import { AuthInfo, StateAggregator, ConfigEntry, OrgAuthorization } from '@salesforce/core';
import herokuVariant from '../lib/heroku-variant';
import { ComputeEnvironment, Dictionary, SfdcAccount } from '../lib/sfdc-types';
import { fetchSfdxProject } from '../lib/utils';
import APIClient, { herokuClientApiUrl } from '../lib/api-client';

type ComputeEnv = {
  alias: any;
  projectName: string;
  connectedOrgAlias: any;
  connectedOrgId: string | undefined;
  computeEnvironmentName: string | undefined;
  computeEnvironmentId: string | undefined;
};

async function fetchAccount(client: APIClient) {
  const { data } = await client.get<SfdcAccount>('/account', {
    headers: {
      ...herokuVariant('salesforce_sso'),
    },
  });

  return data;
}

async function resolveEnvironments(orgs: OrgAuthorization[]): Promise<ComputeEnvironment[]> {
  const stateAggregator = await StateAggregator.getInstance();
  const apiKey = process.env.SALESFORCE_FUNCTIONS_API_KEY;
  let auth;

  if (apiKey) {
    auth = apiKey;
  } else {
    const token = stateAggregator.tokens.get('functions-bearer', true)?.token;

    if (!token) {
      throw new Error('Not authenticated. Please login with `sf login functions`.');
    }
    auth = token;
  }

  const client = new APIClient({
    auth,
    apiUrl: herokuClientApiUrl(),
  });

  const account = await fetchAccount(client);

  const { data: environments } = await client.get<ComputeEnvironment[]>(
    `/enterprise-accounts/${account.salesforce_org.owner.id}/apps`,
    {
      headers: {
        ...herokuVariant('evergreen'),
      },
    }
  );

  const environmentsWithAliases = await resolveAliasesForComputeEnvironments(environments);

  return resolveAliasesForConnectedOrg(environmentsWithAliases, orgs);
}

async function resolveAliasForValue(environmentName: string, entries: ConfigEntry[]) {
  // Because there's no reliable way to query aliases *by their value*, we instead grab *all* of
  // the aliases and create a reverse lookup table that is keyed on the alias values rather than
  // the aliases themselves.

  const aliasReverseLookup = entries.reduce((acc: Dictionary<string>, [alias, environmentName]) => {
    if (typeof environmentName !== 'string') {
      return acc;
    }

    // You might have looked at this and realized that a user could potentially have multiple
    // aliases that point to the same value, in which case we could be clobbering a previous
    // entry here by simply assigning the current alias to the value in the lookup table

    // Congratulations! You are correct, but since we don't have any way to know which alias is
    // the one they care about, we simply have to pick one
    acc[environmentName] = alias;

    return acc;
  }, {});

  return aliasReverseLookup[environmentName] ?? '';
}

async function resolveAliasesForComputeEnvironments(envs: ComputeEnvironment[]) {
  const stateAggregator = await StateAggregator.getInstance();

  const entries = Object.entries(stateAggregator.aliases.getAll()) as ConfigEntry[];

  return Promise.all(
    envs.map(async (env) => {
      return {
        ...env,
        alias: await resolveAliasForValue(env.id!, entries),
      };
    })
  );
}

function resolveAliasesForConnectedOrg(envs: ComputeEnvironment[], orgs: OrgAuthorization[]) {
  return envs.map((env) => {
    const orgId = env.sales_org_connection?.sales_org_id;

    const orgAlias = orgs.reduce((result, org) => {
      if (org.orgId === orgId) {
        return (org.aliases && org.aliases[0]) ?? '';
      }

      return result;
    }, '');

    return {
      ...env,
      orgAlias,
    };
  });
}

const hook: SfHook.EnvList<ComputeEnv> = async function (opts) {
  const orgs = await AuthInfo.listAllAuthorizations();
  let environments = await resolveEnvironments(orgs);

  if (!opts.all) {
    // If the user IS in an SFDX project folder, we will filter compute environments down to ones associated with the project.
    // If they are not, this will throw an error which we will swallow.
    try {
      const project = await fetchSfdxProject();
      environments = environments.filter((env) => env.sfdx_project_name === project.name);
    } catch (e) {}
  }

  return [
    {
      type: EnvList.EnvType.computeEnvs,
      title: 'Compute Environments',
      data: environments.map((env) => {
        return {
          alias: env.alias,
          projectName: env.sfdx_project_name,
          connectedOrgAlias: env.orgAlias,
          connectedOrgId: env.sales_org_connection?.sales_org_id,
          computeEnvironmentName: env.name,
          computeEnvironmentId: env.id,
        };
      }),
    },
  ];
};

export default hook;
