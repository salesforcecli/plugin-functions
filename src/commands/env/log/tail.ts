import {Flags} from '@oclif/core'

import Command from '../../../lib/base'
import * as Heroku from '@heroku-cli/schema'
import axios from 'axios'
import {cli} from 'cli-ux'
import * as Stream from 'stream'
import * as util from 'util'
import EventSource = require('@heroku/eventsource')

type EventSourceError = Error & ({
  status?: number;
  message?: string;
})

// this splits a stream into lines
function lineTransform() {
  const transform = new Stream.Transform({objectMode: true, decodeStrings: false})
  let _lastLineData: string

  transform._transform = function (chunk, _encoding, next) {
    let data = chunk
    if (_lastLineData) data = _lastLineData + data

    const lines = data.split('\n')
    _lastLineData = lines.splice(lines.length - 1, 1)[0]

    lines.forEach(this.push.bind(this))
    next()
  }

  transform._flush = function (done) {
    if (_lastLineData) this.push(_lastLineData)
    _lastLineData = ''
    done()
  }

  return transform
}

function eventSourceStream(url: string, eventSourceOptions: EventSourceOptions, tail?: boolean): Stream.Readable {
  let eventSource: EventSource

  const stream = new Stream.Readable({
    read(_size?: any) {
      if (!eventSource) {
        eventSource = new EventSource(url, eventSourceOptions)
        eventSource.addEventListener('error', (error: EventSourceError) => {
          let msg
          if (error.status) {
            msg = [404, 403].includes(error.status) ? 'Log stream timed out. Please try again' : `Logs eventsource failed with ${error.status} ${error.message}`
          } else if (error.message) {
            msg = error.message
          }

          if (msg) {
            // something bad happened. we probably can't recover, so end the stream and emit an error
            stream.destroy(new Error(msg))
          } else if (!tail) {
            // closed by server for a different reason; out of logs, connection closed without error
            // Since we are not tailing, send the EOF signal to close the stream
            stream.push(null)
          }
        })
        eventSource.addEventListener('message', (event: { data: string }) => {
          stream.push(event.data)
        })
      }
    },
    destroy(error: Error, callback: (_error: Error) => void) {
      if (eventSource) {
        // ensure connection to the server is closed always
        eventSource.close()
      }
      callback(error)
    },
  })

  return stream
}

export default class LogTail extends Command {
  static description = 'stream log output for an environment'

  static examples = [
    'sf env log tail --environment=billingApp-Scratch1',
  ]

  static flags = {
    environment: Flags.string({
      description: 'environment name to retrieve logs',
      char: 'e',
      required: true,
    }),
  }

  async run() {
    const {flags} = await this.parse(LogTail)

    const response = await this.client.post<Heroku.LogSession>(`/apps/${flags.environment}/log-sessions`, {
      data: {
        source: 'app',
        tail: true,
      },
    })

    const logURL = response.data.logplex_url

    if (logURL) {
      await this.readLogs(logURL, true)
    } else {
      this.error('Couldn\'t retreive logs')
    }
    cli.action.stop()
  }

  async simpleStreamingStream(logSessionURL: string): Promise<Stream.Readable> {
    const response = await axios({
      method: 'get',
      url: logSessionURL,
      responseType: 'stream',
    })
    const liner = lineTransform()
    response.data.setEncoding('utf8')
    return response.data.pipe(liner)
  }

  eventSourceStream(logSessionURL: string, tail: boolean): Stream.Readable {
    return eventSourceStream(logSessionURL, {}, tail)
  }

  async readLogs(logSessionURL: string, tail: boolean) {
    const u = new URL(logSessionURL)
    const stream = u.searchParams.has('srv') ? await this.simpleStreamingStream(logSessionURL) : this.eventSourceStream(logSessionURL, tail)
    stream.setEncoding('utf8')

    stream.on('data', data => {
      cli.log(data)
    })

    const finished = util.promisify(Stream.finished)
    await finished(stream)
  }
}
