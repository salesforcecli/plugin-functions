import {expect, test} from '@oclif/test'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as assert from 'yeoman-assert'

const standardfolderarray = [
  'aura',
  'applications',
  'classes',
  'contentassets',
  'flexipages',
  'layouts',
  'objects',
  'permissionsets',
  'staticresources',
  'tabs',
  'triggers',
]
const filestocopy = [
  '.eslintignore',
  '.forceignore',
  '.gitignore',
  '.prettierignore',
  '.prettierrc',
  'package.json',
]
const vscodearray = ['extensions', 'launch', 'settings']

describe('sf generate project', () => {
  before(() => {
    // We do this just in case there was an errant test run that failed and left the previous project
    // folder laying around.
    fs.removeSync('foo')
  })

  test
  .stdout()
  .stderr()
  .finally(() => {
    fs.removeSync('foo')
  })
  .command(['generate:project', '--name=foo'])
  .it('should create a project', () => {
    assert.file([path.join('foo', 'scripts', 'soql', 'account.soql')])
    assert.file([path.join('foo', 'scripts', 'apex', 'hello.apex')])
    assert.file([path.join('foo', 'README.md')])
    assert.file([path.join('foo', 'sfdx-project.json')])
    assert.fileContent(path.join('foo', 'sfdx-project.json'), '"namespace": "",')
    assert.fileContent(path.join('foo', 'sfdx-project.json'), '"path": "force-app",')
    assert.fileContent(path.join('foo', 'sfdx-project.json'), '"name": "foo"')
    assert.fileContent(path.join('foo', 'sfdx-project.json'), 'sourceApiVersion')
    assert.fileContent(path.join('foo', 'sfdx-project.json'), '"sfdcLoginUrl": "https://login.salesforce.com"')
    for (const file of vscodearray) {
      assert.file([path.join('foo', '.vscode', `${file}.json`)])
    }
    assert.fileContent(path.join('foo', 'config', 'project-scratch-def.json'), '"features":["EnableSetPasswordInApi","Functions"]')
    assert.file([
      path.join(
        'foo',
        'force-app',
        'main',
        'default',
        'lwc',
        '.eslintrc.json',
      ),
    ])
    assert.file([
      path.join(
        'foo',
        'force-app',
        'main',
        'default',
        'aura',
        '.eslintrc.json',
      ),
    ])
    for (const file of filestocopy) {
      assert.file([path.join('foo', file)])
    }
    for (const folder of standardfolderarray) {
      assert(
        fs.existsSync(
          path.join('foo', 'force-app', 'main', 'default', folder),
        ),
      )
    }
  })

  test
  .stdout()
  .stderr()
  .finally(() => {
    fs.removeSync('foo')
  })
  .command(['generate:project', '--name=foo'])
  .command(['generate:project', '--name=foo'])
  .catch(error => {
    expect(error.message).to.include('Directory foo already exists.')
  })
  .it('should not create duplicate project in the directory where command is executed')
})
