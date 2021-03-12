import {flags} from '@oclif/command'
import ProjectGenerator from '@salesforce/templates/lib/generators/projectGenerator'
import {Config, Repository, Signature} from 'nodegit'
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
    const env = createEnv()
    env.registerStub(ProjectGenerator, 'project-generator')

    await env.run('project-generator', {...options, projectname: flags.name}, err => {
      if (err) {
        this.error(err)
      }
    })

    // Initialize git repo in the directory we just created
    const repo = await Repository.init(path.resolve(`./${flags.name}`), 0)

    // Get list of changes from the repo (should be all our unstaged files)
    const index = await repo.refreshIndex()

    // Get list of file paths for all our unstaged changes and then stage all of them
    const files = await repo.getStatus()
    const filePaths = files.map(file => file.path())
    await index.addAll(filePaths)
    await index.write()
    const changes = await index.writeTree()

    // Generate Signatures for both author and committer
    const author = Signature.now('salesforce cli team', 'salesforce@cli.com')
    const config = await Config.openDefault()
    const username = await config.getEntry('user.name')
    const email = await config.getEntry('user.email')
    const committer = Signature.now(username.value(), email.value())

    await repo.createCommit('HEAD', author, committer, 'Initial commit from sf cli', changes, [])
  }
}
