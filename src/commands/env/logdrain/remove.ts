import herokuColor from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {flags} from '@oclif/command'
import {FunctionsFlagBuilder} from '../../../lib/flags'
import {cli} from 'cli-ux'
import Command from '../../../lib/base'

export default class LogDrainRemove extends Command {
  static description = 'Remove log drain from a specified environment.'

  static examples = [
    '$ sfdx env:logdrain:remove --environment=billingApp-Sandbox --url=syslog://syslog-a.logdna.com:11137',
  ]

  static flags = {
    environment: FunctionsFlagBuilder.environment(),
    url: flags.string({
      required: true,
      char: 'u',
      description: 'logdrain url to remove',
    }),
  }

  async run() {
    const {flags} = this.parse(LogDrainRemove)
    const {environment} = flags

    const appName = await this.resolveAppNameForEnvironment(environment!)

    cli.action.start(`Deleting drain for environment ${herokuColor.app(environment!)}`)

    await this.client.delete<Heroku.LogDrain>(`apps/${appName}/log-drains/${encodeURIComponent(flags.url)}`)

    cli.action.stop()
  }
}
