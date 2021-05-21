import * as Heroku from '@heroku-cli/schema'
import {cli} from 'cli-ux'
import {flatMap} from 'lodash'
import {FunctionsFlagBuilder} from '../../../lib/flags'
import Command from '../../../lib/base'

export default class ConfigList extends Command {
  static description = 'list your config vars in a table'

  static examples = [
    '$ sfdx env:var:list --environment=my-environment',
  ]

  static flags = {
    environment: FunctionsFlagBuilder.environment(),
  }

  async run() {
    const {flags} = this.parse(ConfigList)
    const {environment} = flags

    const appName = await this.resolveAppNameForEnvironment(environment!)

    const {data: config} = await this.client.get<Heroku.ConfigVars>(`/apps/${appName}/config-vars`)

    const configArray = flatMap(config, (value, key) => {
      return {
        key,
        value,
      }
    })

    if (!configArray.length) {
      this.warn(`No config vars found for environment ${environment}`)
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
