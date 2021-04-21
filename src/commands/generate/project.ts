import {Flags} from '@oclif/core'
import ProjectGenerator from '@salesforce/templates/lib/generators/projectGenerator'
import * as execa from 'execa'
import * as fs from 'fs-extra'
import {Repository, Signature} from 'nodegit'
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
    name: Flags.string({
      description: 'name of the generated project',
      char: 'n',
      required: true,
    }),
  }

  private async hasGit() {
    try {
      await execa('git', ['--version'])
      return true
    } catch (error) {
      return false
    }
  }

  private async gitInit(projectPath: string) {
    // Initialize git repo in the directory we just created
    const repo = await Repository.init(projectPath, 0)

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
    const committer = Signature.now('salesforce cli team', 'salesforce@cli.com')

    await repo.createCommit('HEAD', author, committer, 'Initial commit from sf cli', changes, [])
  }

  async run() {
    const {flags} = await this.parse(GenerateProject)
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

    if (!await this.hasGit()) {
      this.log('No git installation found. Skipping git init.')
      return
    }

    await this.gitInit(projectPath)
  }
}
