import {IPlugin} from '@oclif/config'
import {ConfigAggregator} from '@salesforce/core'

export const DEFAULT_ORG_PREFIX = 'org-'

export function resourceNameForOrg(orgId: string): string {
  return `${DEFAULT_ORG_PREFIX}${orgId.toLowerCase()}`
}

export async function retrieveApiVersion(plugins: IPlugin[]): Promise<string> {
  const userSetApiVersion = (await ConfigAggregator.create()).getConfig().apiVersion
  if (userSetApiVersion)
    return String(userSetApiVersion)

  if (plugins) {
    const plugin = plugins.find(plugin => plugin.name === 'salesforce-alm') ||
                   plugins.find(plugin => plugin.name === 'salesforcedx')
    if (plugin)
      return plugin.version
  }

  return 'unknown'
}
