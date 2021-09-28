/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { AuthInfo, ConfigAggregator, GlobalInfo, Org, SfdxProject } from '@salesforce/core';
import APIClient from './api-client';
import herokuVariant from './heroku-variant';
import { ComputeEnvironment, SfdxProjectConfig } from './sfdc-types';

export async function fetchOrg(aliasOrUsername?: string) {
  // if `aliasOrUsername` is null here, Org.create will pull the default org from the surrounding environment
  return Org.create({
    aliasOrUsername,
  });
}

export async function fetchOrgId(aliasOrUsername?: string) {
  const org = await fetchOrg(aliasOrUsername);

  return org.getOrgId();
}

export async function fetchSfdxProject() {
  const project = await SfdxProject.resolve();

  return project.resolveProjectConfig() as Promise<SfdxProjectConfig>;
}

export async function fetchAppForProject(client: APIClient, projectName: string, orgAliasOrUsername?: string) {
  const orgId = await fetchOrgId(orgAliasOrUsername);

  const { data } = await client.get<ComputeEnvironment>(`/sales-org-connections/${orgId}/apps/${projectName}`, {
    headers: {
      ...herokuVariant('evergreen'),
    },
  });

  return data;
}

export async function resolveAppNameForEnvironment(appNameOrAlias: string): Promise<string> {
  // Check if the environment provided is an alias or not, to determine what app name we use to attempt deletion
  const info = await GlobalInfo.getInstance();
  const matchingAlias = info.aliases.get(appNameOrAlias);
  let appName: string;
  if (matchingAlias) {
    appName = matchingAlias;
  } else {
    appName = appNameOrAlias;
  }
  return appName;
}

export async function resolveOrg(orgId?: string): Promise<Org> {
  // We perform this check because `Org.create` blows up with a non-descriptive error message if you
  // just assume the target org is set
  const config = await ConfigAggregator.create();
  const targetOrg = config.getPropertyValue('target-org') as string;

  if (!orgId && !targetOrg) {
    throw new Error('Attempted to resolve an org without an org ID or target-org value');
  }

  const infos = await AuthInfo.listAllAuthorizations();

  if (infos.length === 0) throw new Error('No connected orgs found');

  if (orgId) {
    const matchingOrg = infos.find((info) => info.orgId === orgId);

    if (matchingOrg) {
      return await Org.create({ aliasOrUsername: matchingOrg.username });
    }
  }

  return Org.create({ aliasOrUsername: targetOrg });
}
