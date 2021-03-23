import herokuColor from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {flags} from '@oclif/command'
import {cli} from 'cli-ux'
import Command from '../../../lib/base'

export default class LogDrainRemove extends Command {
  static description = 'Remove log drain from a specified environment.'

  static examples = [
    '$ sf env logdrain remove --environment=billingApp-Sandbox --url=syslog://syslog-a.logdna.com:11137',
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
      description: 'logdrain url to remove',
    }),
  }

  async run() {
    const {flags} = this.parse(LogDrainRemove)

    cli.action.start(`Deleting drain for environment ${herokuColor.app(flags.environment)}`)

    await this.client.delete<Heroku.LogDrain>(`apps/${flags.environment}/log-drains/${encodeURIComponent(flags.url)}`)

    cli.action.stop()
  }
}
