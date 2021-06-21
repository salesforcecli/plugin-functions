/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as stream from 'stream';

export class Redactor extends stream.Transform {
  redacted: string[];

  constructor(redacted: string[], options: stream.TransformOptions = {}) {
    super(options);
    this.redacted = redacted;
  }

  _transform(chunk: Buffer, encoding: string, callback: stream.TransformCallback) {
    const stringified = chunk.toString();

    const redacted = this.redacted.reduce((acc, elem) => {
      if (!elem) {
        return acc;
      }

      return acc.replace(elem, '<REDACTED>');
    }, stringified);

    this.push(redacted);
    callback();
  }
}

export default Redactor;
