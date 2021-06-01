import {Command, flags} from '@oclif/command'
import * as fs from 'fs'
import getStdin from '../../lib/get-stdin'
import {RunFunction, RunFunctionOptions} from '@salesforce/functions-core'
import Util from '../../util'
export default class Invoke extends Command {
  static description = 'send a cloudevent to a function'

  static examples = [`
    $ sfdx run:function -u http://localhost:8080 -p '{"id": 12345}'
    $ sfdx run:function -u http://localhost:8080 -p '@file.json'
    $ echo '{"id": 12345}' | sfdx run:function -u http://localhost:8080
    $ sfdx run:function -u http://localhost:8080 -p '{"id": 12345}' --structured
`]

  static flags = {
    url: flags.string({
      char: 'u',
      description: 'url of the function to run',
      required: true,
    }),
    headers: flags.string({
      char: 'H',
      description: 'set headers',
      multiple: true,
    }),
    payload: flags.string({
      char: 'p',
      description: 'set the payload of the cloudevent. also accepts @file.txt format',
    }),
    structured: flags.boolean({
      description: 'set the cloudevent to be emitted as a structured cloudevent (json)',
    }),
    targetusername: flags.string({
      char: 't',
      description: 'username or alias for the target org; overrides default target org',
    }),
  }

  async run() {
    const {flags} = this.parse(Invoke)
    const data = await this.getPayloadData(flags.payload)
    if (!data) {
      this.error('no payload provided (provide via stdin or -p)')
    }

    const runFunction = new RunFunction()

    Util.outputSfFunctionCommandEvents(runFunction)

    runFunction.execute(flags as RunFunctionOptions)
  }

  async getPayloadData(payload: string | undefined): Promise<string | undefined> {
    if (payload && payload.startsWith('@')) {
      return fs.readFileSync(payload.slice(1), 'utf8')
    }
    return payload || getStdin()
  }
}
