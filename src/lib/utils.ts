/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { AuthInfo, StateAggregator, Org, OrgAuthorization, SfdxProject } from '@salesforce/core';
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
  const stateAggregator = await StateAggregator.getInstance();
  const matchingAlias = stateAggregator.aliases.getValue(appNameOrAlias);
  let appName: string;
  if (matchingAlias) {
    appName = matchingAlias;
  } else {
    appName = appNameOrAlias;
  }
  return appName;
}

export async function findOrgAuthorization(orgId: string): Promise<OrgAuthorization | undefined> {
  const infos = await AuthInfo.listAllAuthorizations();

  if (infos.length === 0) throw new Error('No connected orgs found');

  return infos.find((info) => info.orgId === orgId);
}

export async function findOrgExpirationStatus(orgId: string): Promise<string | boolean | undefined> {
  const orgAuthorization = await findOrgAuthorization(orgId);
  return orgAuthorization?.isExpired;
}

export async function getOrgUsername(orgId: string): Promise<string | undefined> {
  const org = await resolveOrg(orgId);

  return org?.getUsername();
}

export async function getOrgAlias(orgId: string): Promise<string | undefined> {
  const stateAggregator = await StateAggregator.getInstance();
  const entries = Object.entries(stateAggregator.aliases.getAll());
  const username = await getOrgUsername(orgId);
  const matchingAlias = entries.find((entry) => entry[1] === username);

  if (matchingAlias) {
    return matchingAlias[0];
  }
}

export async function resolveOrg(orgId?: string): Promise<Org> {
  let org;

  if (orgId) {
    const matchingOrgAuth = await findOrgAuthorization(orgId);

    if (matchingOrgAuth) {
      org = await Org.create({ aliasOrUsername: matchingOrgAuth.username });
    }
  }

  if (!org) {
    throw new Error('Attempted to resolve an org without a valid org ID');
  }

  return org;
}
