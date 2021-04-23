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

    // Add 'Functions' feature to the scratch org definition
    const scratchDefPath = path.join(flags.name, 'config', 'project-scratch-def.json')
    const scratchDef = await fs.readJSON(scratchDefPath)
    scratchDef.features = [...scratchDef.features, 'Functions']
    await fs.writeJSON(scratchDefPath, scratchDef)
  }
}
