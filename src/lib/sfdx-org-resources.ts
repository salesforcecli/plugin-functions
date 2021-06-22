/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { Interfaces } from '@oclif/core';
import { ConfigAggregator } from '@salesforce/core';

export const DEFAULT_ORG_PREFIX = 'org-';

export function resourceNameForOrg(orgId: string): string {
  return `${DEFAULT_ORG_PREFIX}${orgId.toLowerCase()}`;
}

export async function retrieveApiVersion(plugins: Interfaces.Plugin[]): Promise<string> {
  const userSetApiVersion = (await ConfigAggregator.create()).getConfig().apiVersion;
  if (userSetApiVersion) return String(userSetApiVersion);

  if (plugins) {
    const plugin =
      plugins.find((plugin) => plugin.name === 'salesforce-alm') ||
      plugins.find((plugin) => plugin.name === 'salesforcedx');
    if (plugin) return plugin.version;
  }

  return 'unknown';
}
