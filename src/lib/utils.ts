/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Org, SfdxProject } from '@salesforce/core';
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
