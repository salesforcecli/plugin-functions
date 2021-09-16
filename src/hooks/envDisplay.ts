/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { GlobalInfo } from '@salesforce/core';
import { SfHook } from '@salesforce/sf-plugins-core';
import APIClient, { herokuClientApiUrl } from '../lib/api-client';
import { ensureArray } from '../lib/function-reference-utils';
import herokuVariant from '../lib/heroku-variant';
import { ComputeEnvironment } from '../lib/sfdc-types';
import { fetchSfdxProject, resolveAppNameForEnvironment, resolveOrg } from '../lib/utils';

interface ComputeEnv {
  alias?: string;
  environmentName: string;
  project: string;
  createdDate?: string;
  functions?: string[];
  connectedOrgs?: string;
  appId?: string;
  spaceId: any;
}

const hook: SfHook.EnvDisplay<ComputeEnv> = async function (opts) {
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
    const salesOrgId = app.sales_org_connection?.sales_org_id;
    const org = await resolveOrg(salesOrgId);
    const project = await fetchSfdxProject();
    const connection = org.getConnection();

    const refList = await connection.metadata.list({ type: 'FunctionReference' });
    const fnNames = ensureArray(refList).map((ref) => ref.fullName.split('-')[1]);

    const alias = appName === targetEnv ? undefined : targetEnv;

    const returnValue = {
      // renamed properties
      alias,
      environmentName: app.name!,
      project: project.name,
      createdDate: app.created_at,
      functions: fnNames.length ? fnNames : undefined,
      connectedOrgs: salesOrgId,
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
