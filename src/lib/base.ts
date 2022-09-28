/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { URL } from 'url';
import { Interfaces, CliUx } from '@oclif/core';
import { SfCommand } from '@salesforce/sf-plugins-core';
import { StateAggregator, Org } from '@salesforce/core';
import APIClient, { herokuClientApiUrl } from './api-client';
import herokuVariant from './heroku-variant';
import { SfdcAccount } from './sfdc-types';

export default abstract class Command extends SfCommand<any> {
  protected static TOKEN_BEARER_KEY = 'functions-bearer';
  protected static TOKEN_REFRESH_KEY = 'functions-refresh';

  protected stateAggregator!: StateAggregator;

  private _client?: APIClient;

  private _auth?: string;

  protected outputJSON = false;

  protected async init(): Promise<void> {
    await super.init();
    this.stateAggregator = await StateAggregator.getInstance();
  }

  // eslint-disable-next-line class-methods-use-this
  protected get identityUrl(): URL {
    const defaultUrl = 'https://cli-auth.heroku.com';
    const envVarUrl = process.env.SALESFORCE_FUNCTIONS_IDENTITY_URL;
    const identityUrl = new URL(envVarUrl ?? defaultUrl);
    return identityUrl;
  }

  protected get username() {
    return this.stateAggregator.tokens.get(Command.TOKEN_BEARER_KEY)?.user;
  }

  protected resetClientAuth() {
    delete this._auth;
    delete this._client;
  }

  protected get auth(): string {
    if (!this._auth) {
      const apiKey = process.env.SALESFORCE_FUNCTIONS_API_KEY;

      if (apiKey) {
        this._auth = apiKey;
      } else {
        const token = this.stateAggregator.tokens.get(Command.TOKEN_BEARER_KEY, true)?.token;

        if (!token) {
          throw new Error(`Not authenticated. Please login with \`${this.config.bin} login functions\`.`);
        }
        this._auth = token;
      }
    }
    return this._auth;
  }

  protected get client(): APIClient {
    if (this._client) {
      return this._client;
    }

    const options = {
      auth: this.auth,
      apiUrl: herokuClientApiUrl(),
    };

    this._client = new APIClient(options);
    return this._client;
  }

  protected catch(err: any): any {
    CliUx.ux.action.stop('failed');

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

  // eslint-disable-next-line class-methods-use-this
  protected async isFunctionsEnabled(org: Org) {
    const conn = org.getConnection();

    // This is a roundabout away of checking if a given org has Functions enabled. If they do NOT have functions enabled,
    // then querying for FunctionReferences will throw an error which complains about not having access to the
    // FunctionReference object for the given org.
    try {
      await conn.metadata.list({ type: 'FunctionReference' });
      return true;
    } catch (err) {
      const error = err as Error;
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

  protected async confirmRemovePrompt(
    type: 'environment',
    name: string,
    confirm?: string | string[],
    warningMessage?: string
  ) {
    const confirmedValue = fetchConfirmationValue(name, confirm);
    if (name !== confirmedValue) {
      warningMessage = warningMessage ?? `This will delete the ${type} ${name}`;
      this.warn(`${warningMessage}\nTo proceed, enter the ${type} name (${name}) again in the prompt below:`);
      // This is a workaround for cli-ux
      // & fancy-test stubbing issues
      // cli-ux mocks itself incorrectly (tbd why)
      // and causes tests to fail (false negatives)
      // Move this import up to the top of the file
      // when that issue has been resolved
      const prompt = await CliUx.ux.prompt('');
      if (prompt !== name) {
        this.error('Confirmation name does not match');
      }
    }
  }

  // This interface is copied from oclif/core
  error(input: string | Error, options: { code?: string; exit: false } & Interfaces.PrettyPrintableError): void;
  error(input: string | Error, options?: { code?: string; exit?: number } & Interfaces.PrettyPrintableError): never;
  error(
    input: string | Error,
    options: { code?: string; exit?: number | false } & Interfaces.PrettyPrintableError = {}
  ): void {
    if (this.outputJSON) {
      if (typeof input === 'string') input = new Error(input);
      const { message, name } = input;
      CliUx.ux.styledJSON({
        status: 1,
        message,
        name,
        warnings: [],
      });
      this.exit(1);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      super.error(input, options as any);
    }
  }

  protected postParseHook(flags: { [name: string]: string | boolean | number | string[] | undefined }) {
    this.outputJSON = flags.json as boolean;
  }
}

const fetchConfirmationValue = (name: string, confirm?: string | string[]): string | undefined => {
  // If multiple confirm values have been specified, we iterate over each one until finding something that could match
  // If there isn't a match, we'll simply return undefined
  if (Array.isArray(confirm)) {
    return confirm.find((value) => value === name);
  }
  return confirm;
};
