import herokuColor from '@heroku-cli/color'
import {cli} from 'cli-ux'
import {Flags} from '@oclif/core'

import Command from '../../../lib/base'

export default class ConfigUnset extends Command {
  static strict = false

  static description = 'unset a single config value for an environment'

  static examples = [
    '$ sf env:var:set foo --app=my-app',
  ]

  static flags = {
    app: Flags.string({
      required: true,
    }),
  }

  async run() {
    const {flags, argv} = await this.parse(ConfigUnset)

    const configPairs = argv.reduce((acc, elem) => {
      return {
        ...acc,
        [elem]: null,
      }
    }, {})

    cli.action.start(`Unsetting ${Object.keys(configPairs).map(key => herokuColor.configVar(key)).join(', ')} and restarting ${herokuColor.app(flags.app)}`)

    await this.client.patch(`/apps/${flags.app}/config-vars`, {
      data: configPairs,
    })

    cli.action.stop()
  }
}
