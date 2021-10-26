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

export default class LocalRun {
  readonly path: string;
  readonly language: string;
  readonly port: number;
  readonly host: string;
  readonly debugPort: number;
  private readonly emitter: events.EventEmitter;
  private readonly runners: Map<string, LangRunner>;

  constructor({
    path = '.',
    language = 'auto',
    host = 'localhost',
    port = 8080,
    debugPort = 9229,
  }: { path?: string; language?: string; host?: string; port?: number; debugPort?: number } = {}) {
    this.path = path;
    this.language = language;
    this.port = port;
    this.host = host;
    this.debugPort = debugPort;
    this.emitter = new events.EventEmitter();
    this.runners = new Map<string, LangRunner>([['node.js', new NodeJsLangRunner(this)]]);
  }

  on(event: string, listener: (...args: any[]) => void) {
    this.emitter.on(event, listener);
  }

  info(message: string) {
    this.emitter.emit('info', message);
  }

  warn(message: string) {
    this.emitter.emit('warn', message);
  }

  async exec(): Promise<void> {
    let runner: LangRunner | null;
    switch (this.language) {
      case 'auto':
        runner = await this.autoDetect();
        break;
      case 'typescript':
      case 'javascript':
        runner = this.runners.get('node.js') || null;
        break;
      default:
        throw new Error(`Local function invoker not availble for language: ${this.language}`);
    }
    if (runner == null) {
      throw new Error(`Could not determine local function invoker for language: ${this.language}`);
    }
    await runner.build();
    await runner.start();
    return;
  }

  private async autoDetect(): Promise<LangRunner | null> {
    const detectionPromises: Array<Promise<LangRunner | null>> = [];
    for (const [k, r] of this.runners.entries()) {
      detectionPromises.push(r.detect().then((detected: boolean) => (detected ? r : null)));
    }

    const detectionResults = await Promise.all(detectionPromises);
    return detectionResults.find((r: LangRunner | null) => r) || null;
  }
}

class LangRunner {
  protected readonly localRun: LocalRun;

  constructor(localRun: LocalRun) {
    this.localRun = localRun;
  }

  async detect(): Promise<boolean> {
    this.localRun.warn('detect not implemented');
    throw new Error('Missing Implementation: detect().');
  }

  async build(): Promise<void> {
    this.localRun.warn('build not implemented');
    throw new Error('Missing Implementation: build().');
  }

  async start(): Promise<void> {
    this.localRun.warn('start not implemented');
    throw new Error('Missing Implementation: start().');
  }
}

class NodeJsLangRunner extends LangRunner {
  async detect(): Promise<boolean> {
    const packageJsonPath = path.resolve(this.localRun.path, 'package.json');
    this.localRun.info(`checking for package.json at ${packageJsonPath}`);
    try {
      await fs.promises.access(packageJsonPath);
    } catch {
      return false;
    }
    return true;
  }

  async build(): Promise<void> {
    await this.checkNodeJs();
    await this.checkNpx();
    await this.runNpmBuild();
  }

  async start(): Promise<void> {
    await this.startRuntime();
  }

  private async checkNodeJs(): Promise<void> {
    try {
      await execa('node', ['-v']);
    } catch (error) {
      throw new Error('Node.JS executable not found.');
    }
  }

  private async checkNpx(): Promise<void> {
    try {
      await execa('npx', ['-v']);
    } catch (error) {
      throw new Error('npx executable not found.');
    }
  }

  private async runNpmBuild(): Promise<void> {
    const packageJsonPath = path.resolve(this.localRun.path, 'package.json');
    let packageJsonContent: string;
    try {
      packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf8');
    } catch {
      throw new Error(`Could not read 'package.json' from ${packageJsonPath}.`);
    }
    let packageJson: { scripts?: { build?: string } };
    try {
      packageJson = JSON.parse(packageJsonContent);
    } catch {
      throw new Error(`Cound not parse 'package.json' as JSON from ${packageJsonPath}.`);
    }

    if (packageJson.scripts?.build) {
      try {
        await execa.command(['npm', 'run', 'build', '--prefix', this.localRun.path].join(' '), { stdio: 'inherit' });
      } catch (err) {
        throw new Error(`Could not execute npm build script: ${err}`);
      }
    }
  }

  private async startRuntime(): Promise<void> {
    try {
      await execa.command(
        [
          'npx',
          '-y',
          '@heroku/sf-fx-runtime-nodejs@0.9.1',
          'serve',
          this.localRun.path,
          '--host',
          this.localRun.host,
          '--port',
          this.localRun.port.toString(),
          '--debug-port',
          this.localRun.debugPort.toString(),
        ].join(' '),
        {
          stdio: 'inherit',
        }
      );
    } catch (err) {
      throw new Error(`Could not execute function runtime: ${err}`);
    }
  }
}
