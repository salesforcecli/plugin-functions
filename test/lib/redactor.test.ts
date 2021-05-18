import Redactor from '../../src/lib/redactor'
import {expect} from 'chai'
import * as stream from 'stream'

function streamToString(stream: stream.Readable) {
  const chunks: Array<Buffer> = []
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)))
    stream.on('error', err => reject(err))
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

describe('Redactor transform', () => {
  it('redacts a single value', async () => {
    const readable = stream.Readable.from(['hello this is your password'])

    const outputStream = readable.pipe(new Redactor(['password']))

    const output = await streamToString(outputStream)

    expect(output).to.equal('hello this is your <REDACTED>')
  })

  it('redacts multiple values', async () => {
    const readable = stream.Readable.from(['hello this is your password'])

    const outputStream = readable.pipe(new Redactor(['password', 'hello']))

    const output = await streamToString(outputStream)

    expect(output).to.equal('<REDACTED> this is your <REDACTED>')
  })

  it('redacts nothing if passed an empty string', async () => {
    const readable = stream.Readable.from(['hello this is your password'])

    const outputStream = readable.pipe(new Redactor(['']))

    const output = await streamToString(outputStream)

    expect(output).to.equal('hello this is your password')
  })
})
