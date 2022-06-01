/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as path from 'path';
import { differenceWith, isEqual } from 'lodash';
import { resolveFunctionsPaths } from './path-utils';
import { parseProjectToml } from './project-toml';
import { SfdxProjectConfig, FunctionReference } from './sfdc-types';

export interface FullNameReference {
  project: string;
  fn: string;
}

export function filterProjectReferencesToRemove(
  allReferences: FullNameReference[],
  successfulReferences: FullNameReference[],
  projectName: string
) {
  const filtered = allReferences.filter((ref) => ref.project === projectName);
  return differenceWith(filtered, successfulReferences, isEqual).map((ref) => `${ref.project}-${ref.fn}`);
}

export function splitFullName(fullName: string): FullNameReference {
  const [project, fn] = fullName.split('-');
  return {
    project,
    fn,
  };
}

export function ensureArray<T>(refList?: T | T[]): T[] {
  if (!refList) {
    // Since the metadata API can sometimes return `undefined` rather than an empty array if no
    // records are found, we cast it into an empty array to avoid any weird "cannot read property
    // foo of undefined" errors further down
    return [];
  }
  if (!Array.isArray(refList)) {
    refList = [refList];
  }
  return refList;
}

export async function resolveFunctionReferences(project: SfdxProjectConfig) {
  // Locate functions directory and grab paths for all function names, error if not in project or no
  // functions found
  const fnPaths = await resolveFunctionsPaths();

  // Create function reference objects
  return Promise.all(
    fnPaths.map(async (fnPath) => {
      const projectTomlPath = path.join(fnPath, 'project.toml');
      const projectToml: any = await parseProjectToml(projectTomlPath);
      const fnName = projectToml.com.salesforce.id;
      const access = projectToml.com.salesforce.access;

      const fnReference: FunctionReference = {
        fullName: `${project.name}-${fnName}`,
        label: fnName,
        description: projectToml.com.salesforce.description,
      };

      const permissionSet = projectToml._.metadata?.permissionSet;

      if (permissionSet) {
        fnReference.permissionSet = permissionSet;
      }

      if (access) {
        fnReference.access = access;
      }

      return fnReference;
    })
  );
}
