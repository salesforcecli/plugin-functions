/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { SfHook } from '@salesforce/sf-plugins-core';
import { Aliases, AuthInfo, Org, SfOrg, GlobalInfo } from '@salesforce/core';
import { sortBy } from 'lodash';
import herokuVariant from '../lib/heroku-variant';
import { ComputeEnvironment, Dictionary, SfdcAccount } from '../lib/sfdc-types';
import { fetchSfdxProject } from '../lib/utils';
import APIClient, { apiUrl } from '../lib/api-client';

type ComputeEnv = {
  alias: any;
  projectName: string;
  connectedOrgAlias: any;
  connectedOrgId: string | undefined;
  computeEnvironmentName: string | undefined;
};

async function resolveOrgs() {
  const infos = await AuthInfo.listAllAuthorizations();
  const orgs: SfOrg[] = [];

  for (const info of infos) {
    try {
      const org = await Org.create({ aliasOrUsername: info.username });
      try {
        await org.refreshAuth();
        info.status = 'Active';
        info.connectionStatus = 'Connected';
      } catch (error) {
        info.status = 'Deleted';
        info.connectionStatus = 'Unknown';
      }
      orgs.push(info);
    } catch (e) {}
  }

  return sortBy(orgs, (v) => [v.alias, v.username]);
}

async function fetchAccount(client: APIClient) {
  const { data } = await client.get<SfdcAccount>('/account', {
    headers: {
      ...herokuVariant('salesforce_sso'),
    },
  });

  return data;
}

async function resolveEnvironments(orgs: SfOrg[]): Promise<ComputeEnvironment[]> {
  const info = await GlobalInfo.getInstance();
  const apiKey = process.env.SALESFORCE_FUNCTIONS_API_KEY;
  let auth;

  if (apiKey) {
    auth = apiKey;
  } else {
    const token = info.getToken('functions-bearer', true)?.token;

    if (!token) {
      throw new Error('Not authenticated. Please login with `sf login functions`.');
    }
    auth = token;
  }

  const client = new APIClient({
    auth,
    apiUrl: apiUrl(),
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

  const environmentsWithAliases = await resolveAliasesForEnvironments(environments);

  return resolveAliasesForConnectedOrg(environmentsWithAliases, orgs);
}

async function resolveAliasForValue(environmentName: string) {
  const aliases = await Aliases.create({});

  const entries = aliases.entries();

  // Because there's no reliable way to query aliases *by their value*, we instead grab *all* of
  // the aliases and create a reverse lookup table that is keyed on the alias values rather than
  // the aliases themselves.Then we cache it, because we definitely don't want to do this any
  // more than we have to.
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

async function resolveAliasesForEnvironments(envs: ComputeEnvironment[]) {
  return Promise.all(
    envs.map(async (env) => {
      return {
        ...env,
        alias: await resolveAliasForValue(env.id!),
      };
    })
  );
}

function resolveAliasesForConnectedOrg(envs: ComputeEnvironment[], orgs: SfOrg[]) {
  return envs.map((env) => {
    const orgId = env.sales_org_connection?.sales_org_id;

    const orgAlias = orgs.reduce((result, org) => {
      if (org.orgId === orgId) {
        return org.alias ?? '';
      }

      return result;
    }, '');

    return {
      ...env,
      orgAlias,
    };
  });
}

const hook: SfHook.EnvList<ComputeEnv> = async function () {
  const orgs = await resolveOrgs();
  let environments = await resolveEnvironments(orgs);

  try {
    const project = await fetchSfdxProject();
    environments = environments.filter((env) => env.sfdx_project_name === project.name);
  } catch (e) {}
  // If the user IS in an SFDX project folder, we will filter compute environments down to ones associated with the project.
  // If they are not, this will throw an error which we will swallow.

  return [
    {
      title: 'Compute Environments',
      data: await environments.map((env) => {
        return {
          alias: env.alias,
          projectName: env.sfdx_project_name,
          connectedOrgAlias: env.orgAlias,
          connectedOrgId: env.sales_org_connection?.sales_org_id,
          computeEnvironmentName: env.name,
        };
      }),
    },
  ];
};

export default hook;
