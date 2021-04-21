import herokuColor from '@heroku-cli/color'
import {cli} from 'cli-ux'
import {Flags} from '@oclif/core'

import Command from '../../../lib/base'

export default class ConfigSet extends Command {
  static strict = false

  static description = 'sets a single config value for an environment'

  static examples = [
    '$ sf env:var:set foo --app=my-app',
  ]

  static flags = {
    app: Flags.string({
      required: true,
    }),
  }

  parseKeyValuePairs(pairs: Array<string>) {
    if (pairs.length === 0) {
      this.error('Usage: sf env:var:set KEY1=VALUE1 [KEY2=VALUE2 ...]\nMust specify KEY and VALUE to set.')
    }

    return pairs.reduce((acc, elem) => {
      if (elem.indexOf('=') === -1) {
        this.error(`${herokuColor.cyan(elem)} is invalid. Please use the format ${herokuColor.cyan('key=value')}`)
      }
      const [key, value] = elem.split('=')
      return {...acc, [key]: value}
    }, {})
  }

  async run() {
    const {flags, argv} = await this.parse(ConfigSet)

    const configPairs = this.parseKeyValuePairs(argv)

    cli.action.start(`Setting ${Object.keys(configPairs).map(key => herokuColor.configVar(key)).join(', ')} and restarting ${herokuColor.app(flags.app)}`)

    await this.client.patch(`/apps/${flags.app}/config-vars`, {
      data: configPairs,
    })

    cli.action.stop()
  }
}
