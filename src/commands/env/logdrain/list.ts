import * as Heroku from '@heroku-cli/schema'
import {flags} from '@oclif/command'
import {cli} from 'cli-ux'
import Command from '../../../lib/base'

export default class LogDrainList extends Command {
  static description = 'List log drains connected to a specified environment'

  static examples = [
    '$ sf env logdrain list --environment=billingApp-Sandbox',
  ]

  static flags = {
    environment: flags.string({
      required: true,
      char: 'e',
      description: 'environment name, ID, or alias',
    }),
    json: flags.boolean({
      description: 'output result in json',
    }),
  }

  async run() {
    const {flags} = this.parse(LogDrainList)

    const {data: drains} = await this.client.get<Array<Heroku.LogDrain>>(`apps/${flags.environment}/log-drains`)

    if (flags.json) {
      cli.styledJSON(drains)
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
