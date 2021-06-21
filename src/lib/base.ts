/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { URL } from 'url';
import { Command as Base } from '@oclif/core';
import { Aliases, Org, SfdxProject } from '@salesforce/core';
import { cli } from 'cli-ux';
import APIClient from './api-client';
import herokuVariant from './heroku-variant';
import NetrcMachine from './netrc';
import { ComputeEnvironment, SfdcAccount, SfdxProjectConfig } from './sfdc-types';

export default abstract class Command extends Base {
  private _client!: APIClient;

  private _auth?: string;

  protected get apiUrl(): URL {
    const defaultUrl = 'https://api.heroku.com';
    const envVarURL = process.env.SALESFORCE_FUNCTIONS_API;
    const apiURL = new URL(envVarURL || defaultUrl);
    return apiURL;
  }

  // This is a hack that lets us store credentials in netrc without clobbering existing heroku creds.
  // In the longer term, we don't want to store creds in netrc *at all*, so we'll eventually be
  // able to remove all this netrc stuff, including the very fake URL
  protected get apiNetRcUrl(): URL {
    return new URL('https://sfdx-functions-netrc-key-only.com');
  }

  protected get identityUrl(): URL {
    const defaultUrl = 'https://cli-auth.heroku.com';
    const envVarUrl = process.env.SALESFORCE_FUNCTIONS_IDENTITY_URL;
    const identityUrl = new URL(envVarUrl || defaultUrl);
    return identityUrl;
  }

  protected get identityNetRcUrl(): URL {
    return new URL('https://sfdx-identity-netrc-key-only.com');
  }

  protected apiNetrcMachine: NetrcMachine = new NetrcMachine(this.apiNetRcUrl.hostname);

  protected identityNetrcMachine: NetrcMachine = new NetrcMachine(this.identityNetRcUrl.hostname);

  get auth(): string | undefined {
    if (!this._auth) {
      const apiKey = process.env.SALESFORCE_FUNCTIONS_API_KEY;

      if (apiKey) {
        this._auth = apiKey;
      } else {
        // what do we do if we get here and this value is empty? trigger login workflow I guess?
        this._auth = this.apiNetrcMachine.get('password');
      }
    }
    return this._auth;
  }

  protected get client(): APIClient {
    if (this._client) {
      return this._client;
    }

    const options = {
      auth: this.auth!,
      apiUrl: this.apiUrl,
    };

    this._client = new APIClient(this.config, options);
    return this._client;
  }

  protected catch(err: any): any {
    cli.action.stop('failed');

    if (err.http?.response?.status === 401) {
      this.error('Your token has expired, please login with sf login functions');
    } else {
      throw err;
    }
  }

  protected async fetchAccount() {
    const { data } = await this.client.get<SfdcAccount>('/account', {
      headers: {
        ...herokuVariant('salesforce_sso'),
      },
    });

    return data;
  }

  protected async fetchOrg(aliasOrUsername?: string) {
    // if `aliasOrUsername` is null here, Org.create will pull the default org from the surrounding environment
    return Org.create({
      aliasOrUsername,
    });
  }

  protected async fetchOrgId(aliasOrUsername?: string) {
    const org = await this.fetchOrg(aliasOrUsername);

    return org.getOrgId();
  }

  protected async fetchSfdxProject() {
    const project = await SfdxProject.resolve();

    return project.resolveProjectConfig() as Promise<SfdxProjectConfig>;
  }

  protected async fetchAppForProject(projectName: string, orgAliasOrUsername?: string) {
    const orgId = await this.fetchOrgId(orgAliasOrUsername);

    const { data } = await this.client.get<ComputeEnvironment>(`/sales-org-connections/${orgId}/apps/${projectName}`, {
      headers: {
        ...herokuVariant('evergreen'),
      },
    });

    return data;
  }

  protected async resolveAppNameForEnvironment(appNameOrAlias: string) {
    // Check if the environment provided is an alias or not, to determine what app name we use to attempt deletion
    const aliases = await Aliases.create({});
    const matchingAlias = aliases.get(appNameOrAlias);
    let appName;
    if (matchingAlias) {
      appName = matchingAlias;
    } else {
      appName = appNameOrAlias;
    }
    return appName;
  }

  protected async isFunctionsEnabled(org: Org) {
    const conn = org.getConnection();

    // This is a roundabout away of checking if a given org has Functions enabled. If they do NOT have functions enabled,
    // then querying for FunctionReferences will throw an error which complains about not having access to the
    // FunctionReference object for the given org.
    try {
      await conn.metadata.list({ type: 'FunctionReference' });
      return true;
    } catch (error) {
      if (
        error.name.includes('INVALID_TYPE') ||
        error.message.includes('Cannot use: FunctionReference in this organization')
      ) {
        return false;
      }

      // If we get here, something very unexpected has happened so just bail
      throw error;
    }
  }

  private fetchConfirmationValue(name: string, confirm?: string | string[]): string | undefined {
    // If multiple confirm values have been specified, we iterate over each one until finding something that could match
    // If there isn't a match, we'll simply return undefined
    if (Array.isArray(confirm)) {
      return confirm.find((value) => value === name);
    }
    return confirm;
  }

  protected async confirmRemovePrompt(
    type: 'environment',
    name: string,
    confirm?: string | string[],
    warningMessage?: string
  ) {
    const confirmedValue = this.fetchConfirmationValue(name, confirm);
    if (name !== confirmedValue) {
      warningMessage = warningMessage || `This will delete the ${type} ${name}`;
      this.warn(`${warningMessage}\nTo proceed, enter the ${type} name (${name}) again in the prompt below:`);
      // This is a workaround for cli-ux
      // & fancy-test stubbing issues
      // cli-ux mocks itself incorrectly (tbd why)
      // and causes tests to fail (false negatives)
      // Move this import up to the top of the file
      // when that issue has been resolved
      const prompt = await cli.prompt('');
      if (prompt !== name) {
        this.error('Confirmation name does not match');
      }
    }
  }
}
