import axios from 'axios'
import {cli} from 'cli-ux'

import Command from '../../lib/base'

export default class Login extends Command {
  static description = 'log into your account'

  static examples = [
    '$ sf login functions',
  ]

  async run() {
    const identityUrl = process.env.SALESFORCE_FUNCTIONS_IDENTITY_URL || 'https://cli-auth.heroku.com'

    const {data: body} = await axios.post(`${identityUrl}/sfdx/auth`, {
      description: 'Login from Sfdx CLI',
    })

    const {browser_url, cli_url, token} = body
    const browserUrl = identityUrl + browser_url
    const cliUrl = identityUrl + cli_url
    const machine = this.apiUrl.hostname

    if (!machine) {
      return this.error('Error reading SALESFORCE_FUNCTIONS_API env var. Check that it is set correctly.')
    }

    this.log(`Opening browser to ${browserUrl}\n`)

    await cli.open(browserUrl)

    cli.action.start('Waiting for login')
    const headers = {Authorization: ('Bearer ' + token)}
    const response = await axios.get(cliUrl, {headers})

    if (response.data.error) {
      return this.error(`${response.data.error}`)
    }
    cli.action.stop()

    cli.action.start('Saving credentials')

    const bearerToken = response.data.access_token

    const refreshToken = response.data.refresh_token

    await this.apiNetrcMachine.set('password', bearerToken)

    const account = await this.fetchAccount()

    await this.apiNetrcMachine.set('login', account.salesforce_username)

    if (refreshToken) {
      await this.identityNetrcMachine.set('password', refreshToken)
    }

    cli.action.stop()
  }
}
