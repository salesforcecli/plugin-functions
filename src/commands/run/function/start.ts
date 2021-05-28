import {Command, flags} from '@oclif/command'
import {cli} from 'cli-ux'
import * as path from 'path'

import {OutputEvent, StartFunction} from '@salesforce/functions-core'

export default class Start extends Command {
  static description = 'build and run function image locally'

  static examples = [`
    $ sfdx run:function:start
    $ sfdx run:function:start -e VAR=VALUE
    $ sfdx run:function:start --network host --no-pull --clear-cache --debug-port 9000 --port 5000
`]

  static flags = {
    builder: flags.string({
      description: 'set custom builder image',
      hidden: true,
    }),
    path: flags.string({
      description: 'path to function dir',
      default: path.resolve('.'),
      hidden: true,
    }),
    port: flags.integer({
      char: 'p',
      description: 'port for running the function',
      default: 8080,
    }),
    'debug-port': flags.integer({
      char: 'd',
      description: 'port for remote debugging',
      default: 9229,
    }),
    'clear-cache': flags.boolean({
      description: 'clear associated cache before executing.',
    }),
    'no-pull': flags.boolean({
      description: 'skip pulling builder image before use',
    }),
    'no-build': flags.boolean({
      description: 'skip building the an image',
      hidden: true,
    }),
    'no-run': flags.boolean({
      description: 'skip running the built image',
      hidden: true,
    }),
    env: flags.string({
      char: 'e',
      description: 'set environment variables (provided during build and run)',
      multiple: true,
    }),
    network: flags.string({
      description: 'Connect and build containers to a network. This can be useful to build containers which require a local resource.',
    }),
    verbose: flags.boolean({
      char: 'v',
      description: 'output additional logs',
    }),
    descriptor: flags.string({
      description: 'Path to project descriptor file (project.toml) that contains function and/or bulid configuration',
      hidden: true,
    }),
  }

  async run() {
    const {flags} = this.parse(Start)
    const startFunction = new StartFunction()

    const types: string[] = ['error', 'warn', 'debug', 'log']
    types.forEach((event:string) => {
      startFunction.on(event as OutputEvent, (data:string) => {
        // Have to reassign cli to the type of any to dodge TypeScript errors
        const cliA:any = cli
        // Calls cli.debug, cli.error, cli.warn etc accordingly
        cliA[event](data)
      })
    })
    startFunction.on('json', (data:string) => {
      cli.styledJSON(data)
    })
    startFunction.on('start_action', (data:string) => {
      cli.action.start(data)
    })

    startFunction.on('stop_action', (data:string) => {
      cli.action.stop(data)
    })
    // TODO: Maybe specify the flag type?
    startFunction.execute(flags as any)
  }
}
