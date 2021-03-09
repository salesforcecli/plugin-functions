import Command from '../../lib/base'

export default class Logout extends Command {
  static description = 'log out of your Salesforce Functions account'

  static examples = [
    '$ sf logout functions',
  ]

  async run() {
    await this.apiNetrcMachine.delete()
    await this.identityNetrcMachine.delete()
    this.log('Logged out successfully')
  }
}
