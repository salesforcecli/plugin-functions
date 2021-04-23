import herokuColor from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {flags} from '@oclif/command'
import {UpsertResult} from 'jsforce'
import {Aliases} from '@salesforce/core'
import {cli} from 'cli-ux'
import {format} from 'date-fns'
import Command from '../../../lib/base'
import * as execa from 'execa'
import {difference} from 'lodash'
import * as path from 'path'
import {URL} from 'url'
import debugFactory from 'debug'
import {parseFunctionToml} from '../../../lib/function-toml'

import {resolveFunctionsPaths} from '../../../lib/path-utils'
import {FunctionReference} from '../../../lib/sfdc-types'
import herokuVariant from '../../../lib/heroku-variant'

const debug = debugFactory('project:deploy:functions')

class Git {
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

    return status.includes('Untracked files:') || status.includes('Changes to be committed:')
  }
}

export default class ProjectDeployFunctions extends Command {
  private git?: Git

  static flags = {
    'connected-org': flags.string({
      char: 'o',
      description: 'deployment org username or alias',
    }),
    branch: flags.string({
      char: 'b',
      description: 'deploy the latest commit from a branch different from the currently active branch',
    }),
    force: flags.string({
      description: 'ignore warnings and overwrite remote repository (not allowed in production)',
    }),
    verbose: flags.boolean({
      description: 'show all deploy output',
      char: 'v',
    }),
  }

  async getCurrentBranch() {
    const statusString = await this.git?.status()

    return statusString!.split('\n')[0].replace('On branch ', '')
  }

  async gitRemote(app: Heroku.App) {
    const username = this.apiNetrcMachine.get('login')
    const token = this.apiNetrcMachine.get('password')

    if (!username || !token) {
      this.error('No login found. Please log in using the `login:functions` command.')
    }

    const url = new URL(app.git_url!)

    url.username = username
    url.password = token

    return url.toString()
  }

  async run() {
    const {flags} = this.parse(ProjectDeployFunctions)
    this.git = new Git()

    // We don't want to deploy anything if they've got work that hasn't been committed yet because
    // it could end up being really confusing since the user isn't calling git directly
    if (await this.git.hasUnpushedFiles()) {
      this.error('Your repo has files that have not been committed yet. Please either commit or stash them before deploying your project.')
    }

    // Heroku side: Fetch git remote URL and push working branch to Heroku git server
    cli.action.start('Pushing functions to compute environment')
    const org = await this.fetchOrg(flags['connected-org'])
    const project = await this.fetchSfdxProject()
    const app = await this.fetchAppForProject(project.name, flags['connected-org'])
    const remote = await this.gitRemote(app)

    debug('pushing to git server using remote: ', remote)

    try {
      const currentBranch = await this.getCurrentBranch()

      const {stdout, stderr} = await this.git.exec(['push', remote, `${currentBranch}:master`])
      if (flags.verbose) {
        process.stdout.write(stdout)
        if (stderr) {
          process.stderr.write(stderr)
        }
      }
    } catch (error) {
      this.error('There was a git-related issue when deploying your functions. ' +
      'This could be caused either by a merge conflict (because someone else has deployed ' +
      'unmergeable changes to the same environment), or by a project name conflict.')
    }

    cli.action.stop()

    cli.action.start('Pushing function references')

    // FunctionReferences: create function reference using info from function.toml and project info,
    // then push to Salesforce org

    // Locate functions directory and grab paths for all function names, error if not in project or no
    // functions found
    const fnPaths = await resolveFunctionsPaths()

    // Create function reference objects
    const references = await Promise.all(fnPaths.map(async fnPath => {
      const fnTomlPath = path.join(fnPath, 'function.toml')
      const fnToml: any = await parseFunctionToml(fnTomlPath)
      const fullName = fnToml.function.name

      const fnReference: FunctionReference = {
        fullName: `${project.name}-${fullName}`,
        label: fullName,
        description: fnToml.function.description,
      }

      const permissionSet = fnToml.metadata?.permissionSet

      if (permissionSet) {
        fnReference.permissionSet = permissionSet
      }

      return fnReference
    }))

    debug('pushing function references', references)

    const connection = org.getConnection()

    const results = await Promise.all(references.map(async reference => {
      const result = await connection.metadata.upsert('FunctionReference', reference) as UpsertResult
      if (!result.success) {
        this.log(`Unable to deploy FunctionReference for ${reference.fullName}.`)
      }

      return result
    }))

    results.forEach(result => {
      this.log(`Reference for ${result.fullName} ${result.created ? herokuColor.cyan('created') : herokuColor.green('updated')}`)
    })

    cli.action.stop()

    // Remove any function references for functions that no longer exist

    cli.action.start('cleaning up function references')

    const successfulReferences = results.reduce((acc: Array<string>, result) => {
      if (result.success) {
        acc.push(result.fullName)
      }

      return acc
    }, [])

    const allReferences = (await connection.metadata.list({type: 'FunctionReference'})).reduce((acc: Array<string>, ref) => {
      acc.push(ref.fullName)

      return acc
    }, [])

    const referencesToRemove = difference(allReferences, successfulReferences)

    await connection.metadata.delete('FunctionReference', referencesToRemove)

    cli.action.stop()
  }
}
