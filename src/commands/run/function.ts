import {Command, flags} from '@oclif/command'
import * as fs from 'fs'
import getStdin from '../../lib/get-stdin'
import {runFunction, RunFunctionOptions} from '@salesforce/functions-core'
import {cli} from 'cli-ux'
import herokuColor from '@heroku-cli/color'
import {AxiosResponse} from 'axios'
import {ConfigAggregator} from '@salesforce/core'

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
    flags.payload = await this.getPayloadData(flags.payload)
    if (!flags.payload) {
      this.error('no payload provided (provide via stdin or -p)')
    }
    const aggregator = await ConfigAggregator.create()
    const defaultusername = aggregator.getPropertyValue('defaultusername');
    if (!flags.targetusername && !defaultusername) {
      this.warn('No -t targetusername or defaultusername found, context will be partially initialized')
    }
    const aliasOrUser = flags.targetusername || `defaultusername ${defaultusername}`
    this.log(`Using ${aliasOrUser} login credential to initialize context`)

    cli.action.start(`${herokuColor.cyanBright('POST')} ${flags.url}`)
    try {
      const response = await runFunction(flags as RunFunctionOptions)
      this.writeResponse(response)
    } catch (error) {
      cli.debug(error)
      if (error.response) {
        cli.action.stop(herokuColor.redBright(`${error.response.status} ${error.response.statusText}`))
        this.debug(error.response)
        this.error(error.response.data)
      } else {
        cli.action.stop(herokuColor.redBright('Error'))
        this.error(error)
      }
    }
  }

  async getPayloadData(payload: string | undefined): Promise<string | undefined> {
    if (payload && payload.startsWith('@')) {
      return fs.readFileSync(payload.slice(1), 'utf8')
    }
    return payload || getStdin()
  }

  writeResponse(response: AxiosResponse) {
    const contentType = response.headers['content-type']
    if (
      contentType.includes('application/json') ||
      contentType.includes('application/cloudevents+json')
    ) {
      cli.styledJSON(response.data)
    } else {
      this.log(response.data)
    }
  }
}

