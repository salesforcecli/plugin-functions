import herokuColor from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'

import {flags} from '@oclif/command'

import Command from '../../../lib/base'

export default class VarGet extends Command {
  static description = 'display a single config value for an environment'

  static examples = [
    '$ sf env var get foo --environment=my-environment',
  ]

  static flags = {
    environment: flags.string({
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
    const {flags, args} = this.parse(VarGet)
    const {environment} = flags

    const appName = await this.resolveAppNameForEnvironment(environment)

    const {data: config} = await this.client.get<Heroku.ConfigVars>(`/apps/${appName}/config-vars`)

    const value = config[args.key]

    if (!value) {
      this.warn(`No config var named ${herokuColor.cyan(args.key)} found for app ${herokuColor.cyan(environment)}`)
    }

    this.log(value)
  }
}
