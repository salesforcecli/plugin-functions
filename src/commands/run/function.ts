/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as fs from 'fs';
import { Errors, Flags } from '@oclif/core';
import { runFunction, RunFunctionOptions } from '@hk/functions-core';
import { cli } from 'cli-ux';
import herokuColor from '@heroku-cli/color';
import { AxiosResponse, AxiosError } from 'axios';
import { ConfigAggregator, Messages } from '@salesforce/core';
import getStdin from '../../lib/get-stdin';
import { FunctionsFlagBuilder } from '../../lib/flags';
import Command from '../../lib/base';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-functions', 'run.function');

export default class Invoke extends Command {
  static summary = messages.getMessage('summary');

  static examples = messages.getMessages('examples');

  static flags = {
    'function-url': Flags.string({
      exclusive: ['url'],
      char: 'l',
      description: messages.getMessage('flags.function-url.summary'),
    }),
    url: Flags.string({
      exclusive: ['function-url'],
      char: 'l',
      description: messages.getMessage('flags.function-url.summary'),
      hidden: true,
    }),
    headers: Flags.string({
      char: 'H',
      description: messages.getMessage('flags.headers.summary'),
      multiple: true,
    }),
    payload: Flags.string({
      char: 'p',
      description: messages.getMessage('flags.payload.summary'),
    }),
    structured: Flags.boolean({
      char: 's',
      description: messages.getMessage('flags.structured.summary'),
    }),
    'connected-org': Flags.string({
      char: 'o',
      description: messages.getMessage('flags.connected-org.summary'),
    }),
  };

  async run() {
    const { flags } = await this.parse(Invoke);
    this.postParseHook(flags);

    const url = flags['function-url'] ?? flags.url;
    if (!url) {
      throw new Errors.CLIError(
        `Missing required flag:
       -l, --function-url FUNCTION-URL  ${herokuColor.dim('Function name.')}
       See more help with --help`
      );
    }
    if (flags.url && !flags.json) {
      cli.warn(messages.getMessage('flags.url.deprecation'));
    }
    flags.payload = await this.getPayloadData(flags.payload);
    if (!flags.payload) {
      this.error('no payload provided (provide via stdin or -p)');
    }
    const aggregator = await ConfigAggregator.create();
    const targetOrg = aggregator.getPropertyValue('target-org');
    if (!flags['connected-org'] && !targetOrg) {
      cli.warn('No -o connected org or target-org found, context will be partially initialized');
    }
    const aliasOrUser = flags['connected-org'] || `target-org ${targetOrg}`;
    if (!flags.json) {
      cli.log(`Using ${aliasOrUser} login credential to initialize context`);
      cli.action.start(`${herokuColor.cyanBright('POST')} ${url}`);
    }
    const runFunctionOptions = {
      ...flags,
      url,
      targetusername: flags['connected-org'] ?? targetOrg,
    };

    try {
      const response = await runFunction(runFunctionOptions as RunFunctionOptions);
      if (flags.json) {
        return response.data;
      } else {
        cli.action.stop(herokuColor.greenBright(response.status.toString()));
        this.writeResponse(response);
      }
    } catch (e) {
      const error = e as AxiosError;
      if (error.response) {
        this.error(new Error(`${error.response.status} ${error.response.statusText}`));
      }
      this.error(new Error(`${error.message}`));
    }
  }

  async getPayloadData(payload: string | undefined): Promise<string | undefined> {
    if (payload && payload.startsWith('@')) {
      return fs.readFileSync(payload.slice(1), 'utf8');
    }
    return payload || getStdin();
  }
  writeResponse(response: AxiosResponse) {
    const contentType = response.headers['content-type'];
    if (contentType.includes('application/json') || contentType.includes('application/cloudevents+json')) {
      cli.styledJSON(response.data);
    } else {
      this.log(response.data as string);
    }
  }
}
