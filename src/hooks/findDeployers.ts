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
  public constructor(public functionsDir: string, private parent: Deployer) {
    super();
  }

  public getAppName(): string {
    return basename(this.functionsDir);
  }

  public getAppType(): string {
    return 'function';
  }

  public getAppPath(): string {
    return basename(this.functionsDir);
  }

  public getEnvType(): string {
    return 'compute';
  }

  public getParent(): Deployer {
    return this.parent;
  }
}

export class FunctionsDeployer extends Deployer {
  public constructor(private functionsDir: string, protected options: Options) {
    super();
    this.deployables = [new FunctionsDeployable(functionsDir, this)];
  }

  public async setup(preferences: Preferences): Promise<Dictionary<string>> {
    if (preferences.interactive) {
    }

    return {};
  }

  public async deploy(): Promise<void> {
    this.log();
    this.log(`Deploying ${cyan.bold(basename(this.functionsDir))}`);
  }
}

const hook = async function (options: Options): Promise<Deployer[]> {
  const project = await SfdxProject.resolve();
  const functionsPath = join(project.getPath(), 'functions');
  return [new FunctionsDeployer(functionsPath, options)];
};

export default hook;
