import {flags} from '@oclif/command'
import ProjectGenerator from '@salesforce/templates/lib/generators/projectGenerator'
import * as fs from 'fs-extra'
import * as path from 'path'
import {createEnv} from 'yeoman-environment'
import Command from '../../lib/base'

const options = {
  outputdir: '.',
  template: 'standard',
  loginurl: 'https://login.salesforce.com',
  defaultpackagedir: 'force-app',
  ns: '',
}

export default class GenerateProject extends Command {
  static flags = {
    name: flags.string({
      description: 'name of the generated project',
      char: 'n',
      required: true,
    }),
  }

  async run() {
    const {flags} = this.parse(GenerateProject)

    if (flags.name.includes('-')) {
      this.error('Project names may not include hyphens, please either remove them or use underscores.')
    }

    const projectPath = path.resolve(`./${flags.name}`)

    if (await fs.pathExists(projectPath)) {
      this.error(`Directory ${flags.name} already exists.`)
    }

    const env = createEnv()
    env.registerStub(ProjectGenerator, 'project-generator')

    await env.run('project-generator', {...options, projectname: flags.name}, err => {
      if (err) {
        this.error(err)
      }
    })
  }
}
