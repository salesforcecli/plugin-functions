import * as stream from 'stream'

export class Redactor extends stream.Transform {
  redacted: Array<string>

  constructor(redacted: Array<string>, options: stream.TransformOptions = {}) {
    super(options)
    this.redacted = redacted
  }

  _transform(chunk: Buffer, encoding: string, callback: stream.TransformCallback) {
    const stringified = chunk.toString()

    const redacted = this.redacted.reduce((acc, elem) => {
      if (!elem) {
        return acc
      }

      return acc.replace(elem, '<REDACTED>')
    }, stringified)

    this.push(redacted)
    callback()
  }
}

export default Redactor
