/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { pathExists, readdir, lstatSync } from 'fs-extra';

const PROJECT_JSON = 'sfdx-project.json';
const FUNCTIONS_DIR = 'functions';

export async function reverseWalk(fileName: string, iterations = 10): Promise<string | null> {
  if (iterations === 0) {
    return null;
  }

  if (await pathExists(fileName)) {
    return fileName;
  }

  return reverseWalk(path.join('..', fileName), iterations - 1);
}

export async function resolveSfdxProjectPath(projectJson = PROJECT_JSON) {
  const projectPath = await reverseWalk(projectJson);

  if (!projectPath) {
    throw new Error('No sfdx project found.');
  }

  return projectPath;
}

export async function resolveFunctionsDirectory() {
  const sfdxProjectPath = await resolveSfdxProjectPath();
  const fnPath = sfdxProjectPath.replace(PROJECT_JSON, FUNCTIONS_DIR);

  if (await pathExists(fnPath)) {
    return fnPath;
  }

  throw new Error('No functions directory found.');
}

export async function resolveFunctionsPaths() {
  const fnDir = await resolveFunctionsDirectory();
  // This is the list of actual functions inside the `functions` directory
  const fnDirs = await readdir(fnDir);

  if (!fnDirs.length) {
    throw new Error('The functions directory does contain any functions.');
  }

  return fnDirs.reduce((acc: string[], fn: string) => {
    const fnPath = path.join(fnDir, fn);
    if (lstatSync(fnPath).isDirectory()) {
      acc.push(fnPath);
    }

    return acc;
  }, []);
}
