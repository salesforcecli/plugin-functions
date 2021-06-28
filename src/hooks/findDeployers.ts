/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { join, basename } from 'path';
import { fs, SfdxProject } from '@salesforce/core';
import { Dictionary } from '@salesforce/ts-types';
import { Deployer, Deployable, Options, Preferences } from '@salesforce/plugin-project-utils';
import { cyan } from 'chalk';

export type FunctionsDir = {
  name: string;
  fullPath: string;
};

export class FunctionsDeployable extends Deployable {
  public constructor(public functionDir: FunctionsDir, private parent: Deployer) {
    super();
  }

  public getAppName(): string {
    return this.functionDir.name;
  }

  public getAppType(): string {
    return 'function';
  }

  public getAppPath(): string {
    return basename(this.functionDir.fullPath);
  }

  public getEnvType(): string {
    return 'compute';
  }

  public getParent(): Deployer {
    return this.parent;
  }
}

export class FunctionsDeployer extends Deployer {
  public constructor(private fn: FunctionsDir, protected options: Options) {
    super();
    this.deployables = [new FunctionsDeployable(fn, this)];
  }

  public async setup(preferences: Preferences): Promise<Dictionary<string>> {
    if (preferences.interactive) {
    }

    return {};
  }

  public async deploy(): Promise<void> {
    this.log();
    this.log(`Deploying ${cyan.bold(this.fn.name)}`);
  }
}

const hook = async function (options: Options): Promise<Deployer[]> {
  const project = await SfdxProject.resolve();
  const functionsDir = join(project.getPath(), 'functions');
  const deployers = (await fs.readdir(functionsDir)).map((f) => {
    const functionDir = { name: f, fullPath: join(functionsDir, f) };
    return new FunctionsDeployer(functionDir, options);
  });
  return deployers;
};

export default hook;
