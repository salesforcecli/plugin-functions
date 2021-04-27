import herokuColor from '@heroku-cli/color'
import {flags} from '@oclif/command'
import {cli} from 'cli-ux'
import debugFactory from 'debug'
import {UpsertResult} from 'jsforce'
import {difference} from 'lodash'
import * as path from 'path'
import {URL} from 'url'
import Command from '../../../lib/base'
import {parseFunctionToml} from '../../../lib/function-toml'
import Git from '../../../lib/git'
import {resolveFunctionsPaths} from '../../../lib/path-utils'
import {ComputeEnvironment, FunctionReference, SfdxProjectConfig} from '../../../lib/sfdc-types'

const debug = debugFactory('project:deploy:functions')

export default class ProjectDeployFunctions extends Command {
  private git?: Git

  static flags = {
    'connected-org': flags.string({
      char: 'o',
      description: 'deployment org username or alias',
      required: true,
    }),
    branch: flags.string({
      char: 'b',
      description: 'deploy the latest commit from a branch different from the currently active branch',
    }),
    force: flags.boolean({
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

  async gitRemote(app: ComputeEnvironment) {
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

  async resolveFunctionReferences(project: SfdxProjectConfig) {
    // Locate functions directory and grab paths for all function names, error if not in project or no
    // functions found
    const fnPaths = await resolveFunctionsPaths()

    // Create function reference objects
    return Promise.all(fnPaths.map(async fnPath => {
      const fnTomlPath = path.join(fnPath, 'function.toml')
      const fnToml: any = await parseFunctionToml(fnTomlPath)
      const fnName = fnToml.function.name

      const fnReference: FunctionReference = {
        fullName: `${project.name}-${fnName}`,
        label: fnName,
        description: fnToml.function.description,
      }

      const permissionSet = fnToml.metadata?.permissionSet

      if (permissionSet) {
        fnReference.permissionSet = permissionSet
      }

      return fnReference
    }))
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
    cli.action.start('Pushing changes to functions')
    const org = await this.fetchOrg(flags['connected-org'])
    const project = await this.fetchSfdxProject()

    let app: ComputeEnvironment
    try {
      app = await this.fetchAppForProject(project.name, flags['connected-org'])
    } catch (error) {
      if (error.body.message?.includes('Couldn\'t find that app')) {
        this.error(`No compute environment found for org ${flags['connected-org']}. Please ensure you've created a compute environment before deploying.`)
      }

      throw error
    }

    if (flags.force && app.sales_org_connection?.sales_org_stage === 'prod') {
      this.error('You cannot use the `--force` flag with a production org.')
    }

    const remote = await this.gitRemote(app)

    debug('pushing to git server using remote: ', remote)

    try {
      const currentBranch = await this.getCurrentBranch()

      const pushCommand = [
        'push',
        remote,
        `${flags.branch ?? currentBranch}:master`,
      ]

      // Since we error out if they try to use `--force` with a production org, we don't check for
      // a production org here since this code would be unreachable in that scenario
      if (flags.force) {
        pushCommand.push('--force')
      }

      const {stdout, stderr} = await this.git.exec(pushCommand)
      if (flags.verbose) {
        process.stdout.write(stdout)
        if (stderr) {
          process.stderr.write(stderr)
        }
      }
    } catch (error) {
      this.error('There was a git-related issue when deploying your functions. ' +
      'This could be caused either by a merge conflict (because someone else has deployed ' +
      'unmergeable changes to the same environment), or by a project name conflict. If this is ' +
      'a non-production environment, you may re-run this command with --force to proceed anyway.')
    }

    // FunctionReferences: create function reference using info from function.toml and project info,
    // then push to Salesforce org
    const references = await this.resolveFunctionReferences(project)

    debug('pushing function references', references)

    const connection = org.getConnection()

    const results = await Promise.all(references.map(async reference => {
      const result = await connection.metadata.upsert('FunctionReference', reference) as UpsertResult
      if (!result.success) {
        this.log(`Unable to deploy FunctionReference for ${reference.fullName}.`)
      }

      return result
    }))

    if (flags.verbose) {
      results.forEach(result => {
        this.log(`Reference for ${result.fullName} ${result.created ? herokuColor.cyan('created') : herokuColor.green('updated')}`)
      })
    }

    // Remove any function references for functions that no longer exist
    const successfulReferences = results.reduce((acc: Array<string>, result) => {
      if (result.success) {
        acc.push(result.fullName)
      }

      return acc
    }, [])

    let refList = await connection.metadata.list({type: 'FunctionReference'})
    if (refList && !Array.isArray(refList)) {
      refList = [refList]
    }

    const allReferences = refList.reduce((acc: Array<string>, ref) => {
      acc.push(ref.fullName)

      return acc
    }, [])

    const referencesToRemove = difference(allReferences, successfulReferences)

    if (referencesToRemove.length) {
      this.log('Removing the following functions that were deleted locally:')
      referencesToRemove.forEach(ref => {
        this.log(ref)
      })
      await connection.metadata.delete('FunctionReference', referencesToRemove)
    }

    cli.action.stop()
  }
}
