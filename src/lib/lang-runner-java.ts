/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import * as execa from 'execa';
import LangRunner from '../lib/lang-runner';
import LocalRun from '../lib/local-run';

const runtimeJarName = 'sf-fx-runtime-java-runtime-1.0.3-jar-with-dependencies.jar';
const runtimeJarUrl = `https://repo1.maven.org/maven2/com/salesforce/functions/sf-fx-runtime-java-runtime/1.0.3/${runtimeJarName}`;
const runtimeJarDir = path.resolve(os.tmpdir(), 'sf-fx-runtime-java-runtime-jar');
const runtimeJarPath = path.resolve(runtimeJarDir, runtimeJarName);
const runtimeJarSha = '1db6d78bdbb7aff7ebe011565190ca9dd4d3e68730e206628230d480d057fe1e';

export default class LangRunnerJava extends LangRunner {
  async detect(): Promise<boolean> {
    const pomXmlPath = path.resolve(this.path, 'pom.xml');
    try {
      await fs.promises.access(pomXmlPath);
    } catch {
      return false;
    }
    return true;
  }

  async build(): Promise<void> {
    await this.checkJava();
    await this.ensureRuntimeJar();
    await this.runMavenInstall();
    await this.runRuntimeJarBundle();
  }

  async start(): Promise<void> {
    await this.runRuntimeJarServe();
  }

  private async checkJava(): Promise<void> {
    try {
      await execa.command('java --version');
    } catch (error) {
      throw new Error('Java executable not found.');
    }
  }

  private async ensureRuntimeJar(): Promise<void> {
    if (await this.checkRuntimeJar()) {
      return;
    }
    await this.downloadRuntimeJar();
  }

  private async runMavenInstall(): Promise<void> {
    try {
      await execa.command(`${path.resolve(this.path, 'mvnw')} install`, { stdio: 'inherit', cwd: this.path });
    } catch (error) {
      throw new Error(`Could not build function with mvnw: ${error}`);
    }
  }

  private async checkRuntimeJar(): Promise<boolean> {
    try {
      await fs.promises.access(runtimeJarPath);
    } catch {
      return false;
    }
    return true;
  }

  private async downloadRuntimeJar(): Promise<void> {
    await fs.promises.mkdir(runtimeJarDir);
    const file = fs.createWriteStream(runtimeJarPath);
    return await new Promise((resolve, reject) => {
      https
        .get(runtimeJarUrl, (resp) => {
          const headers = JSON.stringify(resp.headers);
          if (resp.statusCode !== 200) {
            reject(`Unexpected status code: ${resp.statusCode}`);
            return;
          }
          resp
            .on('data', (chunk) => {
              file.write(chunk);
            })
            .on('end', () => {
              file.end();
              resolve();
            });
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }

  private bundleDir(): string {
    return path.resolve(this.tmpDir, 'bundle');
  }

  private async runRuntimeJarBundle(): Promise<void> {
    await execa.command(`java -jar ${runtimeJarPath} bundle ${this.path} ${this.bundleDir()}`, { stdio: 'inherit' });
  }

  private async runRuntimeJarServe(): Promise<void> {
    await execa.command(`java -jar ${runtimeJarPath} serve --host=${this.host} --port=${this.port} ${this.path}`, {
      stdio: 'inherit',
    });
  }
}
