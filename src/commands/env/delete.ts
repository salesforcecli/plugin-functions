import herokuColor from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {FunctionsFlagBuilder, confirmationFlag} from '../../lib/flags'
import {Org} from '@salesforce/core'
import {cli} from 'cli-ux'
import Command from '../../lib/base'

export default class EnvDelete extends Command {
  static description = 'delete an environment'

  static examples = [
    '$ sfdx env:delete --environment=billingApp-Scratch1',
    '$ sfdx env:delete --environment=billingApp-Scratch1 --confirm=billingApp-Scratch1',
  ]

  static flags = {
    environment: FunctionsFlagBuilder.environment({
      required: true,
    }),
    confirm: confirmationFlag,
  }

  async run() {
    const {flags} = this.parse(EnvDelete)

    const {environment} = flags

    await this.confirmRemovePrompt('environment', environment, flags.confirm)

    cli.action.start(`Deleting environment ${environment}`)

    if (environment) {
      try {
        // If we are able to successfully create an org, then we verify that this name does not refer to a compute environment. Regardless of what happens, this block will result in an error.
        const org: Org = await Org.create({aliasOrUsername: environment})
        if (org) {
          throw new Error(`The environment ${herokuColor.cyan(environment)} is a Salesforce org. The env:delete command currently can only be used to delete compute environments. Please use sfdx force:org:delete to delete scratch and sandbox Salesforce org environments.`)
        }
      } catch (error) {
        // If the error is the one we throw above, then we will send the error to the user. If not (meaning the org creation failed) then we swallow the error and proceed.
        if (error.message.includes(`The environment ${herokuColor.cyan(environment)} is a Salesforce org.`)) {
          this.error(error)
        }
      }
    }

    // Check if the environment provided is an alias or not, to determine what app name we use to attempt deletion
    const appName = await this.resolveAppNameForEnvironment(environment)

    try {
      // If app exists, it will be deleted
      await this.client.delete<Heroku.App>(`/apps/${appName}`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.evergreen',
        },
      })

      cli.action.stop()
    } catch (error) {
      // App with name does not exist
      this.error('Value provided for environment does not match a compute environment name or an alias to a compute environment.')
    }
  }
}
