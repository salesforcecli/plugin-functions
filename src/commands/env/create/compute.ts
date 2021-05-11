import herokuColor from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {flags} from '@oclif/command'
import {Aliases} from '@salesforce/core'
import {cli} from 'cli-ux'
import {format} from 'date-fns'
import Command from '../../../lib/base'

export default class EnvCreateCompute extends Command {
  static description = 'create a compute environment for use with Salesforce Functions'

  static examples = [
    '$ sfdx env:create:compute',
    '$ sfdx env:create:compute --setalias my-compute-environment',
    '$ sfdx env:create:compute --connected-org my-scratch-org',
  ]

  static flags = {
    'connected-org': flags.string({
      char: 'o',
      description: 'username or alias for the org that the compute environment should be connected to',
    }),
    setalias: flags.string({
      char: 'a',
      description: 'alias for the created environment',
    }),
  }

  async run() {
    const {flags} = this.parse(EnvCreateCompute)

    const alias = flags.setalias

    // if `--connected-org` is null here, fetchOrg will pull the default org from the surrounding environment
    const org = await this.fetchOrg(flags['connected-org'])
    const orgId = org.getOrgId()

    const conn = org.getConnection()

    // This is a roundabout away of checking if a given org has Functions enabled. If they do NOT have functions enabled,
    // then querying for FunctionReferences will throw an error which complains about not having access to the
    // FunctionReference object for the given org.
    try {
      await conn.metadata.list({type: 'FunctionReference'})
    } catch (error) {
      if (error.name.includes('INVALID_TYPE') || error.message.includes('Cannot use: FunctionReference in this organization')) {
        this.error(
          `The org you are attempting to create a compute environment for does not have the ${herokuColor.green('Functions')} feature enabled.\n` +
          '\n' +
          'Before you can create a compute environment, please:\n' +
          '1. Enable Functions in your DevHub org\n' +
          `2. Add ${herokuColor.green('Functions')} to the "features" list in your scratch org definition JSON file, e.g. "features": ["Functions"]`,
        )
      }
    }

    cli.action.start(`Creating compute environment for org ID ${orgId}`)

    const project = await this.fetchSfdxProject()
    const projectName = project.name

    if (!projectName) {
      this.error('No project name found in sfdx-project.json.')
    }

    try {
      const {data: app} = await this.client.post<Heroku.App>(`/sales-org-connections/${orgId}/apps`, {
        headers: {
          Accept: 'application/vnd.heroku+json; version=3.evergreen',
        },
        data: {
          sfdx_project_name: projectName,
        },
      })

      cli.action.stop()

      this.log(`New compute environment created with ID ${app.name}`)

      cli.action.start('Connecting environments')

      if (alias) {
        const aliases = await Aliases.create({})

        aliases.set(alias, app.id!)

        await aliases.write()
      }

      cli.action.stop()

      this.log(
        alias ?
          `Your compute environment with local alias ${herokuColor.cyan(alias)} is ready` :
          'Your compute environment is ready.',
      )
    } catch (error) {
      const DUPLICATE_PROJECT_MESSAGE = 'This org is already connected to a compute environment for this project'

      // If environment creation fails because an environment already exists for this org and project
      // we want to fetch the existing environment so that we can point the user to it
      if (error.body?.message?.includes(DUPLICATE_PROJECT_MESSAGE)) {
        cli.action.stop('error!')
        const app = await this.fetchAppForProject(projectName, org.getUsername())

        this.log(`${DUPLICATE_PROJECT_MESSAGE}:`)
        this.log(`Compute Environment ID: ${app.name}`)
        if (app.created_at) {
          this.log(`Created on: ${format(new Date(app.created_at), 'E LLL d HH:mm:ss O y')}`)
        }

        return
      }

      throw error
    }
  }
}
