/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as Stream from 'stream';
import * as util from 'util';
import EventSource = require('@heroku/eventsource');
import axios from 'axios';
import { cli } from 'cli-ux';

export function lineTransform() {
  const transform = new Stream.Transform({ objectMode: true, decodeStrings: false });
  let _lastLineData: string;

  transform._transform = function (chunk: any, _encoding: any, next: () => void) {
    let data = chunk;
    if (_lastLineData) data = _lastLineData + data;

    const lines = data.split('\n');
    _lastLineData = lines.splice(lines.length - 1, 1)[0];

    lines.forEach(this.push.bind(this));
    next();
  };

  transform._flush = function (done: () => void) {
    if (_lastLineData) this.push(_lastLineData);
    _lastLineData = '';
    done();
  };

  return transform;
}

type EventSourceError = Error & {
  status?: number;
  message?: string;
};

export function eventSourceStream(
  url: string,
  eventSourceOptions: EventSourceOptions,
  tail?: boolean
): Stream.Readable {
  let eventSource: EventSource;

  const stream = new Stream.Readable({
    read(_size?: any) {
      if (!eventSource) {
        eventSource = new EventSource(url, eventSourceOptions);
        eventSource.addEventListener('error', (error: EventSourceError) => {
          let msg;
          if (error.status) {
            msg = [404, 403].includes(error.status)
              ? 'Log stream timed out. Please try again'
              : `Logs eventsource failed with ${error.status} ${error.message}`;
          } else if (error.message) {
            msg = error.message;
          }

          if (msg) {
            // something bad happened. we probably can't recover, so end the stream and emit an error
            stream.destroy(new Error(msg));
          } else if (!tail) {
            // closed by server for a different reason; out of logs, connection closed without error
            // Since we are not tailing, send the EOF signal to close the stream
            stream.push(null);
          }
        });
        eventSource.addEventListener('message', (event: { data: string }) => {
          stream.push(event.data);
        });
      }
    },
    destroy(error: Error, callback: (_error: Error) => void) {
      if (eventSource) {
        // ensure connection to the server is closed always
        eventSource.close();
      }
      callback(error);
    },
  });

  return stream;
}

export async function simpleStreamingStream(logSessionURL: string): Promise<Stream.Readable> {
  const response = await axios({
    method: 'get',
    url: logSessionURL,
    responseType: 'stream',
  });
  const liner = lineTransform();
  response.data.setEncoding('utf8');
  return response.data.pipe(liner);
}

export function eventSourceStreamer(logSessionURL: string, tail: boolean): Stream.Readable {
  return eventSourceStream(logSessionURL, {}, tail);
}

export async function readLogs(logSessionURL: string, tail: boolean) {
  const u = new URL(logSessionURL);
  const stream = u.searchParams.has('srv')
    ? await simpleStreamingStream(logSessionURL)
    : eventSourceStreamer(logSessionURL, tail);
  stream.setEncoding('utf8');

  stream.on('data', (data: string) => {
    cli.log(data);
  });

  const finished = util.promisify(Stream.finished);
  await finished(stream);
}
