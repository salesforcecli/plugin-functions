/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import herokuColor from '@heroku-cli/color';
import { Flags } from '@oclif/core';
import { Aliases, AuthInfo, Org, SfOrg, Messages } from '@salesforce/core';
import { cli } from 'cli-ux';
import { sortBy } from 'lodash';
import Command from '../../lib/base';
import herokuVariant from '../../lib/heroku-variant';
import { ComputeEnvironment, Dictionary } from '../../lib/sfdc-types';
import { environmentType } from '../../lib/flags';

type EnvironmentType = 'org' | 'scratchorg' | 'compute';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'env.list');

export default class EnvList extends Command {
  static description = messages.getMessage('summary');

  static examples = messages.getMessages('examples');

  static flags = {
    all: Flags.boolean({
      description: messages.getMessage('flags.all.summary'),
    }),
    'environment-type': environmentType,
    json: Flags.boolean({
      description: messages.getMessage('flags.json.summary'),
      char: 'j',
    }),
  };

  private aliases?: Aliases;

  private aliasReverseLookup?: Dictionary<string>;

  async resolveOrgs(all = false) {
    const infos = await AuthInfo.listAllAuthorizations();
    const nonScratchOrgs: SfOrg[] = [];
    const scratchOrgs: SfOrg[] = [];

    for (const info of infos) {
      const org = await Org.create({ aliasOrUsername: info.username });
      try {
        await org.refreshAuth();
        info.status = 'Active';
        info.connectionStatus = 'Connected';
      } catch (error) {
        info.status = 'Deleted';
        info.connectionStatus = 'Unknown';
      }
      try {
        if (await org.determineIfScratch()) {
          scratchOrgs.push(info);
        } else {
          nonScratchOrgs.push(info);
        }
      } catch (e) {
        nonScratchOrgs.push(info);
      }
    }

    const groupedSortedOrgs = {
      nonScratchOrgs: sortBy(nonScratchOrgs, (v) => [v.alias, v.username]),
      scratchOrgs: sortBy(scratchOrgs, (v) => [v.alias, v.username]),
    };

    return {
      nonScratchOrgs: groupedSortedOrgs.nonScratchOrgs,
      scratchOrgs: all
        ? groupedSortedOrgs.scratchOrgs
        : groupedSortedOrgs.scratchOrgs.filter((org) => org.status === 'Active'),
    };
  }

  private async resolveEnvironments(orgs: SfOrg[]): Promise<ComputeEnvironment[]> {
    const account = await this.fetchAccount();

    const { data: environments } = await this.client.get<ComputeEnvironment[]>(
      `/enterprise-accounts/${account.salesforce_org.owner.id}/apps`,
      {
        headers: {
          ...herokuVariant('evergreen'),
        },
      }
    );

    const environmentsWithAliases = await this.resolveAliasesForEnvironments(environments);

    return this.resolveAliasesForConnectedOrg(environmentsWithAliases, orgs);
  }

  private async resolveAliasForValue(environmentName: string) {
    if (!this.aliases) {
      this.aliases = await Aliases.create({});
    }

    if (!this.aliasReverseLookup) {
      const entries = this.aliases.entries();

      // Because there's no reliable way to query aliases *by their value*, we instead grab *all* of
      // the aliases and create a reverse lookup table that is keyed on the alias values rather than
      // the aliases themselves.Then we cache it, because we definitely don't want to do this any
      // more than we have to.
      this.aliasReverseLookup = entries.reduce((acc: Dictionary<string>, [alias, environmentName]) => {
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
    }

    return this.aliasReverseLookup[environmentName] ?? '';
  }

  private async resolveAliasesForEnvironments(envs: ComputeEnvironment[]) {
    return Promise.all(
      envs.map(async (env) => {
        return {
          ...env,
          alias: await this.resolveAliasForValue(env.id!),
        };
      })
    );
  }

  private resolveAliasesForConnectedOrg(envs: ComputeEnvironment[], orgs: SfOrg[]) {
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

  renderOrgTable(orgs: SfOrg[]) {
    cli.log(herokuColor.bold(`Type: ${herokuColor.cyan('Salesforce Org')}`));

    if (!orgs.length) {
      cli.log('No orgs found');
      return;
    }

    cli.table(orgs, {
      alias: {
        header: 'ALIAS',
        get: (row) => row.alias ?? '',
      },
      username: {
        header: 'USERNAME',
      },
      orgId: {
        header: 'ORG ID',
      },
      connectedStatus: {
        header: 'STATUS',
        get: (row) => herokuColor.green((row.connectedStatus as string) ?? ''),
      },
    });
  }

  renderScratchOrgTable(orgs: SfOrg[]) {
    cli.log(herokuColor.bold(`Type: ${herokuColor.cyan('Scratch Org')}`));

    if (!orgs.length) {
      cli.log('No scratch orgs found');
      return;
    }

    cli.table(orgs, {
      alias: {
        header: 'ALIAS',
        get: (row) => row.alias ?? '',
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
    });
  }

  renderComputeEnvironmentTable(envs: ComputeEnvironment[]) {
    cli.log(herokuColor.bold(`Type: ${herokuColor.cyan('Compute Environment')}`));

    if (!envs.length) {
      cli.log('No compute environments found.');
      return;
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
        get: (row) => row.sales_org_connection?.sales_org_id,
      },
      environmentName: {
        header: 'COMPUTE ENVIRONMENT NAME',
        get: (row) => row.name,
      },
    });
  }

  async run() {
    const { flags } = await this.parse(EnvList);
    const { nonScratchOrgs, scratchOrgs } = await this.resolveOrgs(flags.all);
    const orgs = [...nonScratchOrgs, ...scratchOrgs];
    let environments = await this.resolveEnvironments(orgs);
    const types = (flags['environment-type'] as EnvironmentType[]) ?? ['org', 'scratchorg', 'compute'];

    if (!flags.all) {
      try {
        const project = await this.fetchSfdxProject();

        if (!flags.json) {
          this.log(`Current environments for project ${project.name}\n`);
        }

        if (types.includes('compute')) {
          environments = environments.filter((env) => env.sfdx_project_name === project.name);
        }
      } catch (error) {
        /* We still need to show env regardless of project */
      }
    }

    if (flags.json) {
      const jsonLookup = {
        org: () => {
          return nonScratchOrgs.map((org) => ({
            alias: org.alias || '',
            username: org.username,
            orgId: org.orgId,
            connectedStatus: org.connectedStatus,
          }));
        },
        scratchorg: () => {
          return scratchOrgs.map((org) => ({
            alias: org.alias || '',
            username: org.username,
            orgId: org.orgId,
            connectedStatus: org.connectedStatus,
            expirationDate: org.expirationDate,
          }));
        },
        compute: () => {
          return environments.map((env) => ({
            alias: env.alias,
            projectName: env.sfdx_project_name,
            connectedOrgAlias: env.orgAlias,
            connectedOrgId: env.sales_org_connection?.sales_org_id,
            name: env.name,
          }));
        },
      };

      type JsonLookup = Record<EnvironmentType, ReturnType<typeof jsonLookup[EnvironmentType]>>;

      const output = types.reduce((acc: JsonLookup, type) => {
        acc[type] = jsonLookup[type]();
        return acc;
      }, {} as JsonLookup);

      cli.styledJSON(output);
    } else {
      const tableLookup = {
        org: () => this.renderOrgTable(nonScratchOrgs),
        scratchorg: () => this.renderScratchOrgTable(scratchOrgs),
        compute: () => this.renderComputeEnvironmentTable(environments),
      };

      types.forEach((type, idx) => {
        tableLookup[type]();
        if (idx < types.length - 1) {
          cli.log('=====');
        }
      });
    }
  }
}
