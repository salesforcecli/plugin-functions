/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as events from 'events';
import * as path from 'path';
import * as fs from 'fs';
import * as execa from 'execa';
import LangRunner, { LangRunnerOpts } from '../lib/lang-runner';
import LangRunnerNodeJs from '../lib/lang-runner-nodejs';
import LangRunnerJava from '../lib/lang-runner-java';

export default class LocalRun {
  readonly lang: string;
  private readonly runners: Map<string, LangRunner>;

  constructor(lang = 'auto', runnerOpts: LangRunnerOpts = {}, runners?: Map<string, typeof LangRunner>) {
    this.lang = lang;
    runners =
      runners ??
      new Map<string, typeof LangRunner>([
        ['nodejs', LangRunnerNodeJs],
        ['java', LangRunnerJava],
      ]);

    this.runners = new Map();
    for (const [l, r] of runners) {
      this.runners.set(l, new r(runnerOpts));
    }
  }

  async exec(): Promise<void> {
    let runner: LangRunner | void;
    switch (this.lang) {
      case 'auto':
        runner = await this.autoDetect();
        break;
      case 'javascript':
      case 'typescript':
        runner = this.runners.get('nodejs');
        break;
      default:
        runner = this.runners.get(this.lang);
    }

    if (!runner) {
      throw new Error(`Could not determine local function invoker for language: ${this.lang}`);
    }

    await runner.build();
    await runner.start();
    return;
  }

  private async autoDetect(): Promise<LangRunner | void> {
    const detectionPromises: Array<Promise<LangRunner | void>> = [];
    for (const [k, runner] of this.runners.entries()) {
      detectionPromises.push(runner.detect().then((detected: boolean) => (detected ? runner : undefined)));
    }

    const detectionResults = await Promise.all(detectionPromises);
    return detectionResults.find((r: LangRunner | void) => r);
  }
}
