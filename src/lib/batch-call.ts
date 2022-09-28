/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { chunk } from 'lodash';
import { ensureArray } from './function-reference-utils';

export async function batchCall<T, U>(data: T[], fn: (chunk: T[]) => Promise<U[] | U>) {
  const chunked = chunk(data, 10);
  let results: U[] = [];

  for (const chunk of chunked) {
    // eslint-disable-next-line no-await-in-loop
    const result = await fn(chunk);

    results = [...results, ...ensureArray(result)];
  }

  return results;
}

export default batchCall;
