import * as execa from 'execa'

export class Git {
  private async hasGit() {
    try {
      await execa('git', ['--version'])
      return true
    } catch (error) {
      return false
    }
  }

  async checkGit() {
    try {
      return this.hasGit()
    } catch (error) {
      throw new Error('git must be installed in order to deploy Salesforce Functions')
    }
  }

  async exec(commands: Array<string>) {
    await this.checkGit()

    return execa('git', commands)
  }

  async status() {
    const {stdout} = await this.exec(['status'])
    return stdout
  }

  async hasUnpushedFiles() {
    const status = await this.status()

    return (
      status.includes('Untracked files:') ||
      status.includes('Changes to be committed:') ||
      status.includes('Changes not staged for commit:')
    )
  }
}

export default Git
