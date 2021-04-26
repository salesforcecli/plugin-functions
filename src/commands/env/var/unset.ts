import herokuColor from '@heroku-cli/color'
import {cli} from 'cli-ux'
import {flags} from '@oclif/command'

import Command from '../../../lib/base'

export default class ConfigUnset extends Command {
  static strict = false

  static description = 'unset a single config value for an environment'

  static examples = [
    '$ sf env var unset foo --environment=my-environment',
  ]

  static flags = {
    environment: flags.string({
      required: true,
    }),
  }

  async run() {
    const {flags, argv} = this.parse(ConfigUnset)
    const {environment} = flags

    const appName = await this.resolveAppNameForEnvironment(environment)

    const configPairs = argv.reduce((acc, elem) => {
      return {
        ...acc,
        [elem]: null,
      }
    }, {})

    cli.action.start(`Unsetting ${Object.keys(configPairs).map(key => herokuColor.configVar(key)).join(', ')} and restarting ${herokuColor.app(environment)}`)

    await this.client.patch(`/apps/${appName}/config-vars`, {
      data: configPairs,
    })

    cli.action.stop()
  }
}
