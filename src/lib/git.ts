import * as execa from 'execa'

export class Git {
  async exec(commands: Array<string>, quiet = false) {
    try {
      const subprocess = execa('git', commands)

      if (!quiet) {
        subprocess.stdout?.pipe(process.stdout)
      }

      await subprocess

      if (subprocess.stderr) {
        subprocess.stderr.pipe(process.stderr)
      }

      return subprocess
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('Git must be installed in order to deploy Salesforce Functions')
      }

      throw error
    }
  }

  async status() {
    const {stdout} = await this.exec(['status'], true)
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
