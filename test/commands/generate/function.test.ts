import {expect, test} from '@oclif/test'
import * as sinon from 'sinon'
import * as fs from 'fs-extra'
import * as GenerateFunction from '../../../src/commands/generate/function'

describe('sf generate:function', () => {
  const sandbox: sinon.SinonSandbox = sinon.createSandbox()

  function testTemplate(template: string, sfdxProjectPath: string | null) {
    return test
    .stub(GenerateFunction.default.prototype, 'getSfdxProjectPath', () => sfdxProjectPath)
    .stub(fs, 'mkdirpSync', sandbox.stub())
    .stub(fs, 'outputFileSync', sandbox.stub())
    .stub(fs, 'readJSON', () => {
      return {
        features: ['EnableSetPasswordInApi'],
      }
    })
    .stub(fs, 'writeJSON', sandbox.stub())
    .stdout({print: true})
    .stderr({print: true})
    .finally(() => {
      sandbox.restore()
    })
    .command([
      'generate:function',
      '--name=MyFunction',
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
    expect(fs.writeJSON).to.have.been.calledWith('config/project-scratch-def.json', {features: ['EnableSetPasswordInApi', 'Functions']})
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
    expect(fs.outputFileSync).to.have.been.calledWith('../../../functions/MyFunction/index.ts')
    expect(fs.writeJSON).to.have.been.calledWith('../../../config/project-scratch-def.json', {features: ['EnableSetPasswordInApi', 'Functions']})
  })
})
