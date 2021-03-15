import * as Heroku from '@heroku-cli/schema'
import {cli} from 'cli-ux'
import {flatMap} from 'lodash'
import {flags} from '@oclif/command'

import Command from '../../../lib/base'

export default class ConfigList extends Command {
  static description = 'list your config vars in a table'

  static examples = [
    '$ sf env:config:list foo --app=my-app',
  ]

  static flags = {
    app: flags.string({
      required: true,
    }),
  }

  async run() {
    const {flags} = this.parse(ConfigList)

    const {data: config} = await this.client.get<Heroku.ConfigVars>(`/apps/${flags.app}/config-vars`)

    const configArray = flatMap(config, (value, key) => {
      return {
        key,
        value,
      }
    })

    if (!configArray.length) {
      this.warn(`No config vars found for app ${flags.app}`)
      return
    }

    cli.table(configArray,
      {
        key: {
          header: 'Key',
          get: configVar => configVar.key,
        },
        value: {
          header: 'Value',
          get: configVar => configVar.value,
        },
      },
      {
        printLine: this.log,
        ...flags,
      },
    )
  }
}
