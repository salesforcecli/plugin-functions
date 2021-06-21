/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export function toJavaClassName(input: string): string {
  const preliminaryResult = input
    .replace(/[^A-Za-z0-9 ]/g, '')
    .split(' ')
    .map((match) => match.charAt(0).toUpperCase() + match.substring(1))
    .join('');

  if (/^\d/.exec(preliminaryResult)) {
    return 'A' + preliminaryResult;
  }

  return preliminaryResult;
}

export function toMavenArtifactId(input: string): string {
  return input
    .replace(/[^A-Za-z0-9- ]/g, '') // Remove illegal characters
    .replace(/((?<!^| |[A-Z])[A-Z])/g, (match) => ' ' + match) // Expand camel-case to separate words
    .replace(/ +/, ' ')
    .split(' ')
    .map((match) => match.toLowerCase())
    .join('-');
}
