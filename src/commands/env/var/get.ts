import herokuColor from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'

import {Flags} from '@oclif/core'

import Command from '../../../lib/base'

export default class VarGet extends Command {
  static description = 'display a single config value for an environment'

  static examples = [
    '$ sf env:var:get foo --app=my-app',
  ]

  static flags = {
    app: Flags.string({
      required: true,
    }),
  }

  static args = [
    {
      name: 'key',
      required: true,
    },
  ]

  async run() {
    const {flags, args} = await this.parse(VarGet)

    const {data: config} = await this.client.get<Heroku.ConfigVars>(`/apps/${flags.app}/config-vars`)

    const value = config[args.key]

    if (!value) {
      this.warn(`No config var named ${herokuColor.cyan(args.key)} found for app ${herokuColor.cyan(flags.app)}`)
    }

    this.log(value)
  }
}
