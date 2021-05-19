import herokuColor from '@heroku-cli/color'
import {flags} from '@oclif/command'
import {cli} from 'cli-ux'
import debugFactory from 'debug'
import {UpsertResult} from 'jsforce'
import {differenceWith, isEqual} from 'lodash'
import * as path from 'path'
import {URL} from 'url'
import Command from '../../../lib/base'
import Git from '../../../lib/git'
import {resolveFunctionsPaths} from '../../../lib/path-utils'
import {parseProjectToml} from '../../../lib/project-toml'
import {ComputeEnvironment, FunctionReference, SfdxProjectConfig} from '../../../lib/sfdc-types'

const debug = debugFactory('project:deploy:functions')

interface FullNameReference {
  project: string;
  fn: string;
}

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
    quiet: flags.boolean({
      description: 'limit the amount of output displayed from the deploy process',
      char: 'q',
    }),
  }

  async getCurrentBranch() {
    const statusString = await this.git?.status()

    return statusString!.split('\n')[0].replace('On branch ', '')
  }

  async gitRemote(app: ComputeEnvironment) {
    const externalApiKey = process.env.SALESFORCE_FUNCTIONS_API_KEY
    const url = new URL(app.git_url!)

    if (externalApiKey) {
      url.password = externalApiKey
      url.username = ''

      return url.toString()
    }

    const username = this.apiNetrcMachine.get('login')
    const token = this.apiNetrcMachine.get('password')

    if (!username || !token) {
      this.error('No login found. Please log in using the `login:functions` command.')
    }

    url.username = username
    url.password = token

    return url.toString()
  }

  async resolveFunctionReferences(project: SfdxProjectConfig) {
    // Locate functions directory and grab paths for all function names, error if not in project or no
    // functions found
    const fnPaths = await resolveFunctionsPaths()

    // Create function reference objects
    return Promise.all(
      fnPaths.map(async fnPath => {
        const projectTomlPath = path.join(fnPath, 'project.toml')
        const projectToml: any = await parseProjectToml(projectTomlPath)
        const fnName = projectToml.com.salesforce.id

        const fnReference: FunctionReference = {
          fullName: `${project.name}-${fnName}`,
          label: fnName,
          description: projectToml.com.salesforce.description,
        }

        const permissionSet = projectToml._.metadata?.permissionSet

        if (permissionSet) {
          fnReference.permissionSet = permissionSet
        }

        return fnReference
      }),
    )
  }

  private splitFullName(fullName: string): FullNameReference {
    const [project, fn] = fullName.split('-')
    return {
      project,
      fn,
    }
  }

  // This method generates a list of functions to remove *specific to this project*. We use this
  // so we don't accidentally delete references from other projects that point to the same org
  private filterProjectReferencesToRemove(
    allReferences: Array<FullNameReference>,
    successfulReferences: Array<FullNameReference>,
    projectName: string,
  ) {
    const filtered = allReferences.filter(ref => ref.project === projectName)
    return differenceWith(filtered, successfulReferences, isEqual).map(ref => `${ref.project}-${ref.fn}`)
  }

  async run() {
    const {flags} = this.parse(ProjectDeployFunctions)

    // We pass the api token value to the Git constructor so that it will redact it from any of
    // the server logs
    const redactedToken = process.env.SALESFORCE_FUNCTIONS_API_KEY ?? this.apiNetrcMachine.get('password')
    this.git = new Git([redactedToken ?? ''])

    // We don't want to deploy anything if they've got work that hasn't been committed yet because
    // it could end up being really confusing since the user isn't calling git directly
    if (await this.git.hasUnpushedFiles()) {
      this.error('Your repo has files that have not been committed yet. Please either commit or stash them before deploying your project.')
    }

    // Heroku side: Fetch git remote URL and push working branch to Heroku git server
    cli.action.start('Pushing changes to functions')
    const org = await this.fetchOrg(flags['connected-org'])
    const project = await this.fetchSfdxProject()

    // FunctionReferences: create function reference using info from function.toml and project info
    // we do this early on because we don't want to bother with anything else if it turns out
    // there are no functions to deploy
    const references = await this.resolveFunctionReferences(project)

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

    debug('pushing to git server')

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

    try {
      await this.git.exec(pushCommand, flags.quiet)
    } catch (error) {
      // if they've passed `--quiet` we don't want to show any build server output *unless* there's
      // an error, in which case we want to show all of it
      if (flags.quiet) {
        this.error(error.message.replace(redactedToken, '<REDACTED>'))
      }

      // In this case, they have not passed `--quiet`, in which case we have already streamed
      // the entirety of the build server output and don't need to show it again
      this.error('There was an issue when deploying your functions.')
    }

    debug('pushing function references', references)

    const connection = org.getConnection()

    const results = await Promise.all(references.map(async reference => {
      const result = await connection.metadata.upsert('FunctionReference', reference) as UpsertResult
      if (!result.success) {
        this.log(`Unable to deploy FunctionReference for ${reference.fullName}.`)
      }

      return result
    }))

    if (!flags.quiet) {
      results.forEach(result => {
        this.log(`Reference for ${result.fullName} ${result.created ? herokuColor.cyan('created') : herokuColor.green('updated')}`)
      })
    }

    // Remove any function references for functions that no longer exist
    const successfulReferences = results.reduce(
      (acc: Array<FullNameReference>, result) => {
        if (result.success) {
          acc.push(this.splitFullName(result.fullName))
        }

        return acc
      },
      [],
    )
    let refList = await connection.metadata.list({type: 'FunctionReference'})
    if (refList && !Array.isArray(refList)) {
      refList = [refList]
    }

    const allReferences = refList.reduce(
      (acc: Array<FullNameReference>, ref) => {
        acc.push(this.splitFullName(ref.fullName))

        return acc
      },
      [],
    )

    const referencesToRemove = this.filterProjectReferencesToRemove(allReferences, successfulReferences, project.name)

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
