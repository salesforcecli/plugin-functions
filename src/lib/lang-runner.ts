/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

export interface LangRunnerOpts {
  path?: string;
  host?: string;
  port?: number;
  debugPort?: number;
}

export default class LangRunner {
  protected readonly port: number;
  protected readonly path: string;
  protected readonly host: string;
  protected readonly debugPort: number;
  protected readonly tmpDir: string;

  constructor(opts: LangRunnerOpts) {
    this.path = opts.path || '.';
    this.port = opts.port || 8080;
    this.host = opts.host || 'localhost';
    this.debugPort = opts.debugPort || 9229;
    this.tmpDir = path.resolve(os.tmpdir(), crypto.randomBytes(12).toString('hex'));
  }

  async detect(): Promise<boolean> {
    throw new Error('Missing Implementation: detect().');
  }

  async build(): Promise<void> {
    throw new Error('Missing Implementation: build().');
  }

  async start(): Promise<void> {
    throw new Error('Missing Implementation: start().');
  }
}
