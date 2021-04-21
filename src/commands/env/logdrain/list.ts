import * as Heroku from '@heroku-cli/schema'
import {Flags} from '@oclif/core'
import {cli} from 'cli-ux'
import Command from '../../../lib/base'

export default class LogDrainList extends Command {
  static description = 'List log drains connected to a specified environment'

  static examples = [
    '$ sf env logdrain list --environment=billingApp-Sandbox',
  ]

  static flags = {
    environment: Flags.string({
      required: true,
      char: 'e',
      description: 'environment name, ID, or alias',
    }),
    json: Flags.boolean({
      description: 'output result in json',
    }),
  }

  async run() {
    const {flags} = await this.parse(LogDrainList)

    const {data: drains} = await this.client.get<Array<Heroku.LogDrain>>(`apps/${flags.environment}/log-drains`)

    if (flags.json) {
      cli.styledJSON(drains)
      return
    }

    if (drains.length === 0) {
      this.log(`No log drains found for environment ${flags.environment}.`)
      return
    }

    cli.table<Heroku.LogDrain>(drains, {
      id: {
        header: 'ID',
        get: row => row.id,
      },
      url: {
        header: 'URL',
        get: row => row.url,
      },
    }, {
      printLine: this.log,
      ...flags,
    })
  }
}
