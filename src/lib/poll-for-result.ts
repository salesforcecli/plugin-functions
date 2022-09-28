/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { CliUx } from '@oclif/core';
/* eslint-disable no-await-in-loop */
export default async function pollForResult(fn: () => Promise<boolean>, timeout = 1000) {
  while (!(await fn())) {
    await CliUx.ux.wait(timeout);
  }

  return true;
}
