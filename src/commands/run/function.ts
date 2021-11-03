/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as fs from 'fs';
import { Command, Errors, Flags } from '@oclif/core';
import { runFunction, RunFunctionOptions } from '@heroku/functions-core';
import { cli } from 'cli-ux';
import herokuColor from '@heroku-cli/color';
import { AxiosResponse } from 'axios';
import { ConfigAggregator, Messages } from '@salesforce/core';
import getStdin from '../../lib/get-stdin';

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
    const url = flags['function-url'] ?? flags.url;
    if (!url) {
      throw new Errors.CLIError(
        `Missing required flag:
       -l, --function-url FUNCTION-URL  ${herokuColor.dim('Function name.')}
       See more help with --help`
      );
    }
    if (flags.url) {
      this.warn(messages.getMessage('flags.url.deprecation'));
    }
    flags.payload = await this.getPayloadData(flags.payload);
    if (!flags.payload) {
      this.error('no payload provided (provide via stdin or -p)');
    }
    const aggregator = await ConfigAggregator.create();
    const targetOrg = aggregator.getPropertyValue('target-org');
    if (!flags['connected-org'] && !targetOrg) {
      this.warn('No -o connected org or target-org found, context will be partially initialized');
    }
    const aliasOrUser = flags['connected-org'] || `target-org ${targetOrg}`;
    this.log(`Using ${aliasOrUser} login credential to initialize context`);
    const runFunctionOptions = {
      url,
      ...flags,
      targetusername: flags['connected-org'] ?? targetOrg,
    };
    cli.action.start(`${herokuColor.cyanBright('POST')} ${url}`);
    try {
      const response = await runFunction(runFunctionOptions as RunFunctionOptions);
      cli.action.stop(herokuColor.greenBright(response.status.toString()));
      this.writeResponse(response);
    } catch (error) {
      cli.debug(error);
      if (error.response) {
        cli.action.stop(herokuColor.redBright(`${error.response.status} ${error.response.statusText}`));
        this.debug(error.response);
        this.error(error.response.data);
      } else {
        cli.action.stop(herokuColor.redBright('Error'));
        this.error(error);
      }
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
      this.log(response.data);
    }
  }
}
