/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as path from 'path';
import * as fs from 'fs';
import * as execa from 'execa';
import * as semver from 'semver';
import LangRunner from '../lib/lang-runner';
import LocalRun from '../lib/local-run';

export default class NodeJsLangRunner extends LangRunner {
  async detect(): Promise<boolean> {
    const packageJsonPath = path.resolve(this.path, 'package.json');
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
    let stdout = '';
    try {
      const cmd = await execa.command('node -v');
      ({ stdout } = cmd);
    } catch (error) {
      throw new Error('Node.JS executable not found.');
    }
    const version = semver.clean(stdout);
    if (!version || semver.lt(version, '14.0.0')) {
      throw new Error('Node.js functions require Node.js 14 or greater.');
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
    const packageJsonPath = path.resolve(this.path, 'package.json');
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
        await execa.command(['npm', 'run', 'build', '--prefix', this.path].join(' '), { stdio: 'inherit' });
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
          this.path,
          '--host',
          this.host,
          '--port',
          this.port.toString(),
          '--debug-port',
          this.debugPort.toString(),
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
