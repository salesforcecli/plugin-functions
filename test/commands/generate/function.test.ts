import {expect, test} from '@oclif/test'
import * as fs from 'fs-extra'
import * as sinon from 'sinon'
import * as pathUtils from '../../../src/lib/path-utils'
import * as javaNameUtils from '../../../src/lib/java-name-utils'
import * as path from 'path'

describe('sf generate:function', () => {
  const sandbox: sinon.SinonSandbox = sinon.createSandbox()

  function testTemplate(template: string, sfdxProjectPath: string | null) {
    return test
    .stub(pathUtils, 'resolveSfdxProjectPath', () => {
      if (sfdxProjectPath) {
        return sfdxProjectPath
      }

      throw new Error('no project path')
    })
    .stub(fs, 'mkdirpSync', sandbox.stub())
    .stub(fs, 'outputFileSync', sandbox.stub())
    .stub(pathUtils, 'resolveFunctionsPaths', sandbox.stub())
    .stdout()
    .stderr()
    .finally(() => {
      sandbox.restore()
    })
    .command([
      'generate:function',
      '--name=myfn',
      `--language=${template}`,
    ])
  }

  // Javascript
  const javascriptBasicTemplateFiles = 6
  testTemplate('javascript', 'sfdx-project.json')
  .it('generates a javascript function', ctx => {
    expect(ctx.stderr).to.equal('')
    expect(ctx.stdout).to.contain('Created javascript')
    expect(fs.mkdirpSync).to.be.called
    expect(fs.outputFileSync).to.have.callCount(javascriptBasicTemplateFiles)
  })

  // Typescript
  const typescriptBasicTemplateFiles = 7
  testTemplate('typescript', 'sfdx-project.json')
  .it('generates a typescript function', ctx => {
    expect(ctx.stderr).to.equal('')
    expect(ctx.stdout).to.contain('Created typescript')
    expect(fs.mkdirpSync).to.be.called
    expect(fs.outputFileSync).to.have.callCount(typescriptBasicTemplateFiles)
  })

  testTemplate('javascript', null)
  .catch(error => {
    expect(error.message).to.contain('sf generate function must be run inside an sfdx project')
  })
  .it('does not generate a function when it is not run inside a project', ctx => {
    expect(ctx.stderr).to.equal('')
    expect(ctx.stdout).to.not.contain('Created javascript')
    expect(fs.mkdirpSync).to.not.have.been.called
    expect(fs.outputFileSync).to.not.have.been.called
  })

  testTemplate('typescript', '../../../sfdx-project.json')
  .it('generates a function even if called from below the root of a project', () => {
    expect(fs.outputFileSync).to.have.been.calledWith('../../../functions/myfn/index.ts')
  })

  testTemplate('javascript', 'sfdx-project.json')
  .stub(pathUtils, 'resolveFunctionsPaths', () => {
    throw new Error('No functions directory found')
  })

  test
  .command(['generate:function', '--name=1fn', '--language=javascript'])
  .catch(error => {
    expect(error.message).to.include('Function names must')
  })
  .it('does not allow a function name that starts with a number')

  test
  .command(['generate:function', '--name=fn-1', '--language=javascript'])
  .catch(error => {
    expect(error.message).to.include('Function names must')
  })
  .it('does not allow a function name that contains a hyphen')

  test
  .command(['generate:function', '--name=fn_1', '--language=javascript'])
  .catch(error => {
    expect(error.message).to.include('Function names must')
  })
  .it('does not allow a function name that contains an underscore')

  test
  .command(['generate:function', '--name=fn_1', '--language=javascript'])
  .catch(error => {
    expect(error.message).to.include('Function names must')
  })
  .it('does not allow a function name that contains an underscore')

  test
  .command(['generate:function', '--name=FN', '--language=javascript'])
  .catch(error => {
    expect(error.message).to.include('Function names must')
  })
  .it('does not allow a function name that contains capital letters')

  test
  .command(['generate:function', `--name=${'x'.repeat(48)}`, '--language=javascript'])
  .catch(error => {
    expect(error.message).to.include('Function names cannot contain more than 47 characters.')
  })
  .it('does not allow a function name that contains more than 47 characters')

  test
  .stub(pathUtils, 'resolveSfdxProjectPath', () => 'sfdx-project.json')
  .stub(fs, 'mkdirpSync', sandbox.stub())
  .stub(fs, 'outputFileSync', sandbox.stub())
  .stub(pathUtils, 'resolveFunctionsPaths', sandbox.stub().throws({message: 'No functions directory found.'}))
  .stdout({print: true})
  .stderr({print: true})
  .finally(() => {
    sandbox.restore()
  })
  .command([
    'generate:function',
    '--name=myfn',
    '--language=javascript',
  ])
  .it('prints welcome message', ctx => {
    expect(ctx.stdout).to.contain('Before creating Scratch Orgs for development, please ensure that:')
  })
})

describe('sf generate:function --language java', () => {
  const sandbox: sinon.SinonSandbox = sinon.createSandbox()

  function testJavaTemplate(sfdxProjectPath: string | null) {
    return test
    .stub(pathUtils, 'resolveSfdxProjectPath', () => {
      if (sfdxProjectPath) {
        return sfdxProjectPath
      }

      throw new Error('no project path')
    })
    .stub(fs, 'mkdirpSync', sandbox.spy())
    .stub(fs, 'copySync', sandbox.spy())
    .stub(fs, 'outputFileSync', sandbox.spy())
    .stub(pathUtils, 'resolveFunctionsPaths', sandbox.stub())
    .stdout()
    .stderr()
    .finally(() => {
      // We cannot effectively stub all fs calls for Java template tests and we need to clean up after the test
      if (sfdxProjectPath) {
        fs.removeSync(path.join(path.dirname(sfdxProjectPath), 'functions', 'MyFunction'))
      }

      sandbox.restore()
    })
    .command([
      'generate:function',
      '--name=myfn',
      '--language=java',
    ])
  }

  const javaBasicFiles = 7
  const javaTemplateFiles = 4
  testJavaTemplate('sfdx-project.json')
  .it('generates a java function', ctx => {
    expect(ctx.stderr).to.equal('')
    expect(ctx.stdout).to.contain('Created java')
    expect(fs.mkdirpSync).to.have.been.called
    expect(fs.copySync).to.have.callCount(javaBasicFiles)
    expect(fs.outputFileSync).to.have.callCount(javaTemplateFiles)
  })
})

describe('toJavaClassName', () => {
  it('removes illegal characters from the name', () => {
    expect(javaNameUtils.toJavaClassName('Hello👋')).to.equal('Hello')
    expect(javaNameUtils.toJavaClassName('FoöBär')).to.equal('FoBr')
    expect(javaNameUtils.toJavaClassName('FooÄaa')).to.equal('Fooaa')
  })

  it('removes spaces and capitalizes the next word after a space', () => {
    expect(javaNameUtils.toJavaClassName('Hello world')).to.equal('HelloWorld')
  })

  it('does not mangle already camel-cased names', () => {
    expect(javaNameUtils.toJavaClassName('HelloWorld function')).to.equal('HelloWorldFunction')
  })

  it('adds a prefix when the first character is not a letter', () => {
    expect(javaNameUtils.toJavaClassName('99 Red Balloons')).to.equal('A99RedBalloons')
  })
})

describe('toMavenArtifactId', () => {
  it('removes illegal characters from the name', () => {
    expect(javaNameUtils.toMavenArtifactId('Hello👋')).to.equal('hello')
    expect(javaNameUtils.toMavenArtifactId('FoöBär')).to.equal('fo-br')
    expect(javaNameUtils.toMavenArtifactId('FooÄaa')).to.equal('fooaa')
  })

  it('replaces spaces with dashes', () => {
    expect(javaNameUtils.toMavenArtifactId('Hello world Function')).to.equal('hello-world-function')
  })

  it('replaces multiple spaces with only one dash', () => {
    expect(javaNameUtils.toMavenArtifactId('Hello    world')).to.equal('hello-world')
  })

  it('does not mangle uppercase names like acronyms', () => {
    expect(javaNameUtils.toMavenArtifactId('There are too many TLAs')).to.equal('there-are-too-many-tlas')
  })
})
