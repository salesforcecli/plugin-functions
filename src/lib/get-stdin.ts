/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const { stdin } = process;

// Borrowed from https://github.com/sindresorhus/get-stdin/blob/147d91ccdb23748b4655192781928df9f4fb4aee/index.js
// but not directly installed because Node ES modules are a huge pain and it breaks the entire build.
export default async function getStdin() {
  let result = '';

  if (stdin.isTTY) {
    return result;
  }

  stdin.setEncoding('utf8');

  for await (const chunk of stdin) {
    result += chunk;
  }

  return result;
}
