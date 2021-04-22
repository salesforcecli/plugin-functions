import herokuColor from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {flags} from '@oclif/command'
import {UpsertResult} from 'jsforce'
import {Aliases} from '@salesforce/core'
import {cli} from 'cli-ux'
import {format} from 'date-fns'
import Command from '../../../lib/base'
import * as execa from 'execa'
import * as path from 'path'
import {URL} from 'url'
import debugFactory from 'debug'
import {parseFunctionToml} from '../../../lib/function-toml'

import {resolveFunctionsPaths} from '../../../lib/path-utils'

const debug = debugFactory('project:deploy:functions')

interface FunctionReference {
  fullName: string;
  label: string;
  namespace?: string;
  description: string;
  permissionSet?: string;
}

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
}

export default class ProjectDeployFunctions extends Command {
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
  }

  gitRemote(app: Heroku.App) {
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
    const git = new Git()

    // Heroku side: Fetch git remote URL and push working branch to Heroku git server

    const org = await this.fetchOrg(flags['connected-org'])
    const project = await this.fetchSfdxProject()
    console.log(project)
    const app = await this.fetchAppForProject(project.name, flags['connected-org'])

    // const remote = this.gitRemote(app)

    // const {stdout, stderr} = await git.exec(['push', remote, 'master'])
    // if (stderr) {
    //   process.stderr.write(stderr)
    // }
    // process.stdout.write(stdout)

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
        // namespace: project.namespace,
      }

      const permissionSet = fnToml.metadata?.permissionSet

      if (permissionSet) {
        fnReference.permissionSet = permissionSet
      }

      return fnReference
    }))

    const connection = org.getConnection()

    const results = await Promise.all(references.map(async reference => {
      const result = await connection.metadata.upsert('FunctionReference', reference) as UpsertResult
      if (!result.success) {
        this.log(`Unable to deploy FunctionReference for ${reference.fullName}.`)
      }

      return result
    }))

    console.log(results)

    // Remove any function references for functions that no longer exist
  }
}
