/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as stream from 'stream';
import { expect } from 'chai';
import Redactor from '../../src/lib/redactor';

function streamToString(stream: stream.Readable) {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: ArrayBuffer) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

describe('Redactor transform', () => {
  it('redacts a single value', async () => {
    const readable = stream.Readable.from(['hello this is your password']);

    const outputStream = readable.pipe(new Redactor(['password']));

    const output = await streamToString(outputStream);

    expect(output).to.equal('hello this is your <REDACTED>');
  });

  it('redacts multiple values', async () => {
    const readable = stream.Readable.from(['hello this is your password']);

    const outputStream = readable.pipe(new Redactor(['password', 'hello']));

    const output = await streamToString(outputStream);

    expect(output).to.equal('<REDACTED> this is your <REDACTED>');
  });

  it('redacts nothing if passed an empty string', async () => {
    const readable = stream.Readable.from(['hello this is your password']);

    const outputStream = readable.pipe(new Redactor(['']));

    const output = await streamToString(outputStream);

    expect(output).to.equal('hello this is your password');
  });
});
