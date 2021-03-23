import herokuColor from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {flags} from '@oclif/command'
import {cli} from 'cli-ux'
import Command from '../../../lib/base'

export default class LogDrainAdd extends Command {
  static description = 'Add log drain to a specified environment'

  static examples = [
    '$ sf env logdrain add --environment=billingApp-Sandbox --url=https://example.com/drain',
  ]

  static flags = {
    environment: flags.string({
      required: true,
      char: 'e',
      description: 'environment name, ID, or alias',
    }),
    url: flags.string({
      required: true,
      char: 'u',
      description: 'endpoint that will receive sent logs',
    }),
  }

  async run() {
    const {flags} = this.parse(LogDrainAdd)

    cli.action.start(`Creating drain for environment ${herokuColor.app(flags.environment)}`)

    await this.client.post<Heroku.LogDrain>(`apps/${flags.environment}/log-drains`, {
      data: {
        url: flags.url,
      },
    })

    cli.action.stop()
  }
}
