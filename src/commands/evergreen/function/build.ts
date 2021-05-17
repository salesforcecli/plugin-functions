import herokuColor from '@heroku-cli/color'
import {Command, flags} from '@oclif/command'
import {cli} from 'cli-ux'
import * as path from 'path'

import Benny from '../../../benny'
import {updateBenny} from '../../../install-benny'
import Util from '../../../util'

export default class Build extends Command {
  static description = 'build function source code into a deployable image'

  static examples = [`
    $ sfdx evergreen:function:build image-repo/myfunction:dev
    $ sfdx evergreen:function:build image-repo/myfunction:dev --path /path/to/function/src
    $ sfdx evergreen:function:build image-repo/myfunction:dev --network host
`]

  static args = [
    {
      name: 'image',
      description: 'image name, must be in all lowercase',
      required: true,
    },
  ]

  static flags = {
    path: flags.string({
      char: 'p',
      description: 'path to function dir',
      default: path.resolve('.'),
    }),
    'no-pull': flags.boolean({
      description: 'Skip pulling builder and run images before use.',
    }),
    verbose: flags.boolean({
      char: 'v',
      description: 'output raw build logs',
    }),
    'clear-cache': flags.boolean({
      description: "Clear image's associated cache before building.",
    }),
    env: flags.string({
      char: 'e',
      description: "Build-time environment variable, in the form 'VAR=VALUE'" +
        "or 'VAR'. When using latter value-less form, value will be taken " +
        'from current environment at the time this command is executed. ' +
        'This flag may occur multiple times if more than one variable is ' +
        'desired.',
      multiple: true,
    }),
    'env-file': flags.string({
      description: 'Build-time environment variables file comprised of one ' +
        "variable per line, of the form 'VAR=VALUE' or 'VAR' When using " +
        'latter value-less form, value will be taken from current ' +
        'environment at the time this command is executed.',
    }),
    builder: flags.string({
      description: 'Builder image',
      hidden: true,
    }),
    buildpack: flags.string({
      description: 'Buildpack ID, path to a Buildpack directory, or path/URL to a Buildpack .tgz file. Repeat for each buildpack in order.',
      multiple: true,
    }),
    network: flags.string({
      description: 'Connect and build containers to a network. This can be useful to build containers which require a local resource.',
    }),
    descriptor: flags.string({
      description: 'Path to project descriptor file (function.toml or project.toml) that contains function and/or bulid configuration',
      hidden: true,
    }),
  }

  async run() {
    const {args, flags} = this.parse(Build)
    const opts = {...flags}

    opts.descriptor = opts.descriptor ?? path.join(opts.path, 'function.toml')

    try {
      await Util.getProjectDescriptor(opts.descriptor)
    } catch (error) {
      cli.error(error)
    }

    if (args.image !== args.image.toLowerCase()) {
      this.error(`image name ${herokuColor.heroku(args.image)} must be in all lowercase`)
    }

    await updateBenny()

    const rawLogs: string[] = []

    const benny = new Benny()

    benny.on('error', msg => {
      this.error(msg.text, {exit: false})
    })

    benny.on('message', msg => {
      if (msg.text) {
        if (opts.verbose) {
          this.log(msg.text, {pipe: 'stderr'})
        } else {
          rawLogs.push(msg.text)
        }
      }
    })

    benny.on('log', msg => {
      if (msg.level === 'error') {
        cli.action.stop(herokuColor.red('failed'))

        // dump everything to err
        rawLogs.forEach(log => {
          cli.error(log, {exit: false})
        })
        cli.exit(1)
      } else if (msg.text) {
        cli.action.status = msg.text
      }
    })

    cli.action.start(`Building image ${herokuColor.heroku(args.image)}`)
    await benny.build(args.image, opts)
    cli.action.stop()
  }
}
