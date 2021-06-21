/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { differenceWith, isEqual } from 'lodash';

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

export function ensureArray<T>(refList: T | T[]): T[] {
  if (!Array.isArray(refList)) {
    refList = [refList];
  }
  return refList;
}
