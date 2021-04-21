import herokuColor from '@heroku-cli/color'
import {Flags} from '@oclif/core'
import {Aliases, AuthInfo} from '@salesforce/core'
import {identifyActiveOrgByStatus, OrgListUtil} from '@salesforce/plugin-org/lib/shared/orgListUtil'
import {ExtendedAuthFields} from '@salesforce/plugin-org/lib/shared/orgTypes'
import {cli} from 'cli-ux'
import {sortBy} from 'lodash'
import Command from '../../lib/base'
import herokuVariant from '../../lib/heroku-variant'
import {ComputeEnvironment, Dictionary} from '../../lib/sfdc-types'

type EnvironmentType = 'org' | 'scratchorg' | 'compute'

export default class EnvList extends Command {
  static description = 'List all environments by type'

  static examples = [
    '$ sf env list',
    '$ sf env list --all',
    '$ sf env list --environment-type org --environment-type compute',
  ]

  static flags = {
    all: Flags.boolean({
      description: 'show all available envs instead of scoping to active orgs and their connected compute envs',
    }),
    'environment-type': Flags.string({
      char: 't',
      description: 'filter by one or more environment types (org, scratchorg, compute)',
      options: ['org', 'scratchorg', 'compute'],
      multiple: true,
    }),
  }

  private aliases?: Aliases

  private aliasReverseLookup?: Dictionary<string>

  async resolveOrgs(all = false) {
    // adapted from https://github.com/salesforcecli/plugin-org/blob/3012cc04a670e4bf71e75a02e2f0981a71eb4e0d/src/commands/force/org/list.ts#L44-L90
    let fileNames: Array<string> = []
    try {
      fileNames = await AuthInfo.listAllAuthFiles()
    } catch (error) {
      if (error.name === 'NoAuthInfoFound') {
        this.error('No orgs found')
      } else {
        throw error
      }
    }

    const metaConfigs = await OrgListUtil.readLocallyValidatedMetaConfigsGroupedByOrgType(fileNames, {})

    const groupedSortedOrgs = {
      nonScratchOrgs: sortBy(metaConfigs.nonScratchOrgs, v => [v.alias, v.username]),
      scratchOrgs: sortBy(metaConfigs.scratchOrgs, v => [v.alias, v.username]),
    }

    return {
      nonScratchOrgs: groupedSortedOrgs.nonScratchOrgs,
      scratchOrgs: all ?
        groupedSortedOrgs.scratchOrgs :
        groupedSortedOrgs.scratchOrgs.filter(identifyActiveOrgByStatus),
    }
  }

  private async resolveEnvironments(orgs: Array<ExtendedAuthFields>) {
    const account = await this.fetchAccount()

    const {data: environments} = await this.client.get<Array<ComputeEnvironment>>(`/enterprise-accounts/${account.salesforce_org.owner.id}/apps`, {
      headers: {
        Accept: herokuVariant('evergreen'),
      },
    })

    const environmentsWithAliases = await this.resolveAliasesForEnvironments(environments)

    return this.resolveAliasesForConnectedOrg(environmentsWithAliases, orgs)
  }

  private async resolveAliasForValue(environmentName: string) {
    if (!this.aliases) {
      this.aliases = await Aliases.create({})
    }

    if (!this.aliasReverseLookup) {
      const entries = this.aliases.entries()

      // Because there's no reliable way to query aliases *by their value*, we instead grab *all* of
      // the aliases and create a reverse lookup table that is keyed on the alias values rather than
      // the aliases themselves.Then we cache it, because we definitely don't want to do this any
      // more than we have to.
      this.aliasReverseLookup = entries.reduce((acc: Dictionary<string>, [alias, environmentName]) => {
        if (typeof environmentName !== 'string') {
          return acc
        }

        // You might have looked at this and realized that a user could potentially have multiple
        // aliases that point to the same value, in which case we could be clobbering a previous
        // entry here by simply assigning the current alias to the value in the lookup table

        // Congratulations! You are correct, but since we don't have any way to know which alias is
        // the one they care about, we simply have to pick one
        acc[environmentName] = alias

        return acc
      }, {})
    }

    return this.aliasReverseLookup[environmentName] ?? ''
  }

  private async resolveAliasesForEnvironments(envs: Array<ComputeEnvironment>) {
    return Promise.all(envs.map(async env => {
      return {
        ...env,
        alias: await this.resolveAliasForValue(env.name!),
      }
    }))
  }

  private resolveAliasesForConnectedOrg(envs: Array<ComputeEnvironment>, orgs: Array<ExtendedAuthFields>) {
    return envs.map(env => {
      const orgId = env.sales_org_connection?.sales_org_id

      const orgAlias = orgs.reduce((result, org) => {
        if (org.orgId === orgId) {
          return org.alias ?? ''
        }

        return result
      }, '')

      return {
        ...env,
        orgAlias,
      }
    })
  }

  renderOrgTable(orgs: Array<ExtendedAuthFields>) {
    cli.log(herokuColor.bold(`Type: ${herokuColor.cyan('Salesforce Org')}`))

    if (!orgs.length) {
      cli.log('No orgs found')
      return
    }

    cli.table(orgs, {
      alias: {
        header: 'ALIAS',
        get: row => row.alias ?? '',
      },
      username: {
        header: 'USERNAME',
      },
      orgId: {
        header: 'ORG ID',
      },
      connectedStatus: {
        header: 'STATUS',
        get: row => herokuColor.green(row.connectedStatus ?? ''),
      },
    })
  }

  renderScratchOrgTable(orgs: Array<ExtendedAuthFields>) {
    cli.log(herokuColor.bold(`Type: ${herokuColor.cyan('Scratch Org')}`))

    if (!orgs.length) {
      cli.log('No scratch orgs found')
      return
    }

    cli.table(orgs, {
      alias: {
        header: 'ALIAS',
        get: row => row.alias ?? '',
      },
      username: {
        header: 'USERNAME',
      },
      orgId: {
        header: 'ORG ID',
      },
      expirationDate: {
        header: 'EXPIRATION',
      },
    })
  }

  renderComputeEnvironmentTable(envs: Array<ComputeEnvironment>) {
    cli.log(herokuColor.bold(`Type: ${herokuColor.cyan('Compute Environment')}`))

    if (!envs.length) {
      cli.log('No compute environments found.')
      return
    }

    cli.table(envs, {
      alias: {
        header: 'ALIAS',
      },
      sfdx_project_name: {
        header: 'PROJECT NAME',
      },
      orgAlias: {
        header: 'CONNECTED ORG ALIAS',
      },
      orgId: {
        header: 'CONNECTED ORG ID',
        get: row => row.sales_org_connection?.sales_org_id,
      },
      environmentName: {
        header: 'COMPUTE ENVIRONMENT NAME',
        get: row => row.name,
      },
    })
  }

  async run() {
    const {flags} = await this.parse(EnvList)
    const project = await this.fetchSfdxProject()
    const {nonScratchOrgs, scratchOrgs} = await this.resolveOrgs(flags.all)
    const orgs = [...nonScratchOrgs, ...scratchOrgs]
    let environments = await this.resolveEnvironments(orgs)
    const types = flags['environment-type'] as Array<EnvironmentType> ?? ['org', 'scratchorg', 'compute']

    if (!flags.all) {
      this.log(`Current environments for project ${project.name}\n`)

      if (types.includes('compute')) {
        environments = environments.filter(env => env.sfdx_project_name === project.name)
      }
    }

    const tableLookup = {
      org: () => this.renderOrgTable(nonScratchOrgs),
      scratchorg: () => this.renderScratchOrgTable(scratchOrgs),
      compute: () => this.renderComputeEnvironmentTable(environments),
    }

    types.forEach((type, idx) => {
      tableLookup[type]()
      if (idx < types.length - 1) {
        cli.log('=====')
      }
    })
  }
}
