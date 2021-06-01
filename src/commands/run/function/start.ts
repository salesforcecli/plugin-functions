import {Command, flags} from '@oclif/command'
import * as path from 'path'

import {StartFunction} from '@salesforce/functions-core'
import Util from '../../../util'
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

    Util.outputSfFunctionCommandEvents(startFunction)

    startFunction.execute(flags as any)
  }
}
