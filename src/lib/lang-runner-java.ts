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
import * as crypto from 'crypto';
import * as execa from 'execa';
import LangRunner from '../lib/lang-runner';
import LocalRun from '../lib/local-run';

const runtimeJarVersion = '1.0.3';
const runtimeJarName = `sf-fx-runtime-java-runtime-${runtimeJarVersion}-jar-with-dependencies.jar`;
const runtimeJarUrl = `https://repo1.maven.org/maven2/com/salesforce/functions/sf-fx-runtime-java-runtime/${runtimeJarVersion}/${runtimeJarName}`;
const runtimeJarDir = path.resolve(os.tmpdir(), 'sf-fx-runtime-java');
const runtimeJarPath = path.resolve(runtimeJarDir, `sf-fx-runtime-java-${runtimeJarVersion}.jar`);
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
    await this.runMavenCompile();
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

  private async runMavenCompile(): Promise<void> {
    let mvnBin = path.resolve(this.path, 'mvnw');
    try {
      // check to see if `mvnw` exists in function root.
      await fs.promises.access(mvnBin);
    } catch {
      // mvnw does not exist, use user installed `mvn` instead.
      mvnBin = 'mvn';
    }
    try {
      // ensure mvn or mvnw exists and is executable
      await execa.command(`${mvnBin} --version`, { cwd: this.path });
    } catch (error) {
      throw new Error(`Could not run maven executable: ${error}`);
    }
    try {
      await execa.command(`${mvnBin} compile`, { stdio: 'inherit', cwd: this.path });
    } catch (error) {
      throw new Error(`Could not compile function with maven: ${error}`);
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
    try {
      await this.ensureDirExists(runtimeJarDir);
      await this.downloadToFile(runtimeJarUrl, runtimeJarPath);
      await this.verifyFileSha(runtimeJarPath, runtimeJarSha);
    } catch (err) {
      try {
        await fs.promises.unlink(runtimeJarPath);
      } catch {
        // failed to delete the jar -- probably never created it.
      }
      throw err;
    }
  }

  private async runRuntimeJarServe(): Promise<void> {
    await execa.command(`java -jar ${runtimeJarPath} serve --host=${this.host} --port=${this.port} ${this.path}`, {
      cwd: this.path,
      stdio: 'inherit',
    });
  }

  private downloadToFile(url: string, path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(path);
      https
        .get(url, (resp) => {
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
              resolve(undefined);
            });
        })
        .on('error', (err) => {
          reject(err);
        });
    });
  }

  private async verifyFileSha(path: string, expectedDigest: string): Promise<void> {
    const shaHash = crypto.createHash('sha256');
    const fileBuf = await fs.promises.readFile(path);
    shaHash.update(fileBuf);
    const actualDigest = shaHash.digest('hex');

    if (expectedDigest !== actualDigest) {
      throw new Error(`${path} could not be validated.`);
    }
  }

  private async ensureDirExists(dir: string): Promise<void> {
    try {
      await fs.promises.mkdir(dir);
    } catch (err) {
      // Don't throw if the dir already existed
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
  }
}
