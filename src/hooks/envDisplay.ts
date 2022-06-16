/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { StateAggregator } from '@salesforce/core';
import { SfHook } from '@salesforce/sf-plugins-core';
import APIClient, { herokuClientApiUrl } from '../lib/api-client';
import { ensureArray } from '../lib/function-reference-utils';
import herokuVariant from '../lib/heroku-variant';
import { ComputeEnvironment } from '../lib/sfdc-types';
import {
  fetchSfdxProject,
  resolveAppNameForEnvironment,
  resolveOrg,
  findOrgExpirationStatus,
  getOrgAlias,
  getOrgUsername,
} from '../lib/utils';

interface ComputeEnv {
  alias?: string;
  environmentName: string;
  project: string;
  createdDate?: string;
  functions?: string[];
  connectedOrgId: string;
  connectedOrgStatus: string;
  connectedOrgAlias?: string;
  connectedOrgUsername?: string;
  appId?: string;
  spaceId: any;
}

const hook: SfHook.EnvDisplay<ComputeEnv> = async function (opts) {
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

  const { targetEnv } = opts;

  // Check if the environment provided is an alias or not, to determine what app name we use to attempt deletion
  const appName = await resolveAppNameForEnvironment(targetEnv);

  try {
    // If app exists, environment details will be displayed
    const { data: app } = await client.get<ComputeEnvironment>(`/apps/${appName}`, {
      headers: {
        ...herokuVariant('evergreen'),
      },
    });

    const org = await resolveOrg(app.sales_org_connection?.sales_org_id);
    const orgId = org.getOrgId();
    const project = await fetchSfdxProject();

    const isExpired = await findOrgExpirationStatus(orgId);

    let fnNames;
    if (!isExpired) {
      const connection = org.getConnection();
      const refList = await connection.metadata.list({ type: 'FunctionReference' });
      fnNames = ensureArray(refList).map((ref) => ref.fullName.split('-')[1]);
    }

    const alias = appName === targetEnv ? undefined : targetEnv;
    const connectedOrgAlias = await getOrgAlias(orgId);
    const connectedOrgUsername = await getOrgUsername(orgId);

    const returnValue = {
      // renamed properties
      alias,
      environmentName: app.name!,
      project: project.name,
      createdDate: app.created_at,
      connectedOrgId: orgId,
      connectedOrgStatus: isExpired ? 'Expired' : 'Active',
      connectedOrgAlias,
      connectedOrgUsername,
      functions: fnNames,
      appId: app.id,
      spaceId: app.space?.id,
    };

    return {
      data: returnValue,
      keys: {
        appId: 'App ID',
        spaceId: 'Space ID',
      },
    };
  } catch (error) {
    return { data: null };
  }
};

export default hook;
