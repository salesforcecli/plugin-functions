import herokuColor from '@heroku-cli/color'
import {flags} from '@oclif/command'
import {copySync, existsSync, lstatSync, mkdirpSync, outputFileSync, readdirSync, readFileSync, readJSON, writeJSON} from 'fs-extra'
import * as Handlebars from 'handlebars'
import * as path from 'path'
import Command from '../../lib/base'
import {resolveSfdxProjectPath} from '../../lib/path-utils'
import {retrieveApiVersion} from '../../lib/sfdx-org-resources'

const FUNCTIONS_DIR = 'functions'
const TEMPLATE_DIR = '../../../templates'
const PROJECT_JSON = 'sfdx-project.json'

// Get from SFDX config.  Query for latest versions in pre-hook?
const SFDX_SDK_VERSION = process.env.SFDX_SDK_VERSION || '^1.4.0'

interface WriteTemplateConfig {
  fnDir: string;
  toFile: string;
  tplArgs: any;
  tplFile: string;
  options?: any;
}

interface TemplateConfig {
  fnDir: string;
  fnName: string;
  fnNameCased: string;  // always capitalize the 1st character of the user specified function name
  isFunctionBundle: boolean;
}

/**
 * Base template class.  Writes project files and
 * FunctionBundle metadata file, if applicable.
 */
abstract class Template {
  abstract get name(): string

  write(tplConfig: TemplateConfig): void {
    // Create function dir, if applicable
    mkdirpSync(tplConfig.fnDir)
    this.writeLanguageFiles(tplConfig)
    this.writeFunctionToml(tplConfig)
  }

  get templateDir(): string {
    return path.join(__dirname, TEMPLATE_DIR, this.name)
  }

  // Write function.toml
  protected writeFunctionToml(tplConfig: TemplateConfig): void {
    const tplArgs = {name: tplConfig.fnName}
    this.writeFileFromTemplate({
      fnDir: tplConfig.fnDir,
      toFile: 'function.toml',
      tplFile: path.join(__dirname, TEMPLATE_DIR, 'function.toml.tpl'),
      tplArgs,
    })
  }

  // Overwrite to write language-specific files
  protected abstract writeLanguageFiles(tplConfig: TemplateConfig): void

  protected writeFileFromTemplate(writeTemplate: WriteTemplateConfig): void {
    const tplFileContents = readFileSync(writeTemplate.tplFile, 'utf8')
    const tplCompiled = Handlebars.compile(tplFileContents, writeTemplate.options)
    const fileContents = tplCompiled(writeTemplate.tplArgs)
    const file = path.join(writeTemplate.fnDir, writeTemplate.toFile)
    outputFileSync(file, fileContents)
  }
}

/**
 * Manages templates.
 */
class TemplateRegistry {
  templateNames: Array<string>

  private readonly templates: Array<Template>

  constructor() {
    this.templates = new Array<Template>()
    this.templateNames = new Array<string>()
  }

  registerTemplate(template: Template): void {
    if (this.templateNames.includes(template.name)) {
      throw new Error(`Template '${template.name}' already registered.`)
    }

    this.templates.push(template)
    this.templateNames.push(template.name)
  }

  getTemplate(name: string): Template | undefined {
    return this.templates.find(template => name === template.name)
  }
}
const TEMPLATE_REGISTRY = new TemplateRegistry()

/**
 * Javascript template.
 */
class Javascript extends Template {
  protected fnNameCased = ''

  get name(): string {
    return 'javascript'
  }

  writeLanguageFiles(tplConfig: TemplateConfig): void {
    this.fnNameCased = tplConfig.fnNameCased
    const fnDir = tplConfig.fnDir

    // index.js
    this.writeFileFromTemplate({fnDir: fnDir, toFile: `index.${this.indexFileExtension}`,
      tplFile: path.join(this.templateDir, `index.${this.indexFileExtension}.tpl`),
      tplArgs: {fnNameCased: this.fnNameCased}})

    // package.json
    const fnNameHyphened = tplConfig.fnName.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase()
    this.writeFileFromTemplate({fnDir: fnDir, toFile: 'package.json',
      tplFile: path.join(this.templateDir, 'package.json.tpl'),
      tplArgs: {fnNameHyphened: fnNameHyphened, sfSdkVersion: SFDX_SDK_VERSION}})

    // README
    this.writeFileFromTemplate({fnDir: fnDir, toFile: 'README.md',
      tplFile: path.join(this.templateDir, 'README.md.tpl'),
      tplArgs: {fnNameCased: this.fnNameCased}})

    // eslint config
    this.writeFileFromTemplate({fnDir: tplConfig.fnDir, toFile: '.eslintrc',
      tplFile: path.join(this.templateDir, '.eslintrc.tpl'),
      tplArgs: {}})

    // Test
    const fnTestDir = path.join(tplConfig.fnDir, 'test')
    mkdirpSync(fnTestDir)
    this.writeFileFromTemplate({fnDir: fnTestDir, toFile: `unitTests.${this.indexFileExtension}`,
      tplFile: path.join(this.templateDir, `unitTests.${this.indexFileExtension}.tpl`),
      tplArgs: {fnNameCased: this.fnNameCased}})
  }

  protected get indexFileExtension() {
    return 'js'
  }
}
TEMPLATE_REGISTRY.registerTemplate(new Javascript())

/**
 * Typescript template.
 */
class Typescript extends Javascript {
  get name(): string {
    return 'typescript'
  }

  write(tplConfig: TemplateConfig): void {
    super.write(tplConfig)

    // Typescript config
    this.writeFileFromTemplate({fnDir: tplConfig.fnDir, toFile: 'tsconfig.json',
      tplFile: path.join(this.templateDir, 'tsconfig.json.tpl'),
      tplArgs: {fnNameCased: this.fnNameCased}})
  }

  protected get indexFileExtension() {
    return 'ts'
  }
}
TEMPLATE_REGISTRY.registerTemplate(new Typescript())

/**
 * Java template.
 */
class Java extends Template {
  protected fnNameJavaClass = ''

  protected fnNameMavenArtifactId = ''

  get name(): string {
    return 'java'
  }

  protected writeLanguageFiles(tplConfig: TemplateConfig): void {
    this.fnNameJavaClass = Java.toJavaClassName(tplConfig.fnName)
    this.fnNameMavenArtifactId = Java.toMavenArtifactId(tplConfig.fnName)

    this.copyRecursivelySync(this.templateDir, tplConfig.fnDir)
  }

  private copyRecursivelySync(dir: string, targetDir: string): void {
    readdirSync(dir).forEach(entry => {
      const fullEntryPath = path.join(dir, entry)

      if (lstatSync(fullEntryPath).isDirectory()) {
        mkdirpSync(fullEntryPath)
        this.copyRecursivelySync(fullEntryPath, path.join(targetDir, entry))
      } else {
        if (path.extname(entry) === '.tpl') {
          const filename = entry.substring(0, entry.lastIndexOf('.'))
          const filenameTemplate = Handlebars.compile(filename)

          this.writeFileFromTemplate({
            fnDir: targetDir, toFile: filenameTemplate({fnNameJavaClass: this.fnNameJavaClass}),
            tplFile: fullEntryPath,
            tplArgs: {fnNameJavaClass: this.fnNameJavaClass, fnNameMavenArtifactId: this.fnNameMavenArtifactId},
          })

          return
        }

        copySync(fullEntryPath, path.join(targetDir, entry))
      }
    })
  }

  private static toJavaClassName(input: string): string {
    const preliminaryResult = input
    .replace(/[^A-Za-z0-9 ]/g, '')
    .split(' ')
    .map(match => match.charAt(0).toUpperCase() + match.toLowerCase().substring(1))
    .join('')

    if (preliminaryResult.match(/^\d/)) {
      return 'A' + preliminaryResult
    }

    return preliminaryResult
  }

  private static toMavenArtifactId(input: string): string {
    return input
    .replace(/[^A-Za-z0-9- ]/g, '')
    .split(' ')
    .map(match => match.toLowerCase())
    .join('-')
  }
}
TEMPLATE_REGISTRY.registerTemplate(new Java())

/**
 * Based on given language, create function project with specific scaffolding.
 */
export default class GenerateFunction extends Command {
  static description = 'create a function with basic scaffolding specific to a given language'

  static aliases = [
    'evergreen:function:init',
  ]

  static examples = [
    '$ sfdx evergreen:function:create MyFunction --language=javascript',
  ]

  static flags = {
    name: flags.string({
      required: true,
      description: 'function name',
      char: 'n',
    }),
    language: flags.enum({
      options: ['javascript', 'typescript', 'java'],
      description: 'language',
      char: 'l',
      required: true,
    }),
  }

  async run() {
    const {flags} = this.parse(GenerateFunction)

    // Determine if we're in an SFDX project and return the path to sfdx-project.json
    let sfdxProjectPath

    try {
      sfdxProjectPath = await resolveSfdxProjectPath(PROJECT_JSON)
    } catch (error) {
      this.error(`${herokuColor.cyan('sf generate function')} must be run inside an sfdx project`)
    }

    const fnName = flags.name
    const fnNameCased = fnName.charAt(0).toUpperCase() + fnName.slice(1)

    // We construct `fnDir` this way because `sfdxProjectPath` will be a relative
    // filepath (e.g. `../../sfdx-project.json`)
    // This allows the user to generate a function from anywhere inside their project and still have the
    // new function actually get created in the root
    const fnDir = path.join(sfdxProjectPath.replace(PROJECT_JSON, FUNCTIONS_DIR), fnName)

    const scratchDefPath = path.join(sfdxProjectPath.replace(PROJECT_JSON, 'config'), 'project-scratch-def.json')
    const scratchDef = await readJSON(scratchDefPath)
    // Add 'Functions' feature to the project scratch org definition if it doesn't already exist
    if (!scratchDef.features.includes('Functions')) {
      scratchDef.features = [...scratchDef.features, 'Functions']
      await writeJSON(scratchDefPath, scratchDef)
    }

    if (existsSync(fnDir)) {
      this.error(`A function named ${flags.name} already exists.`)
    }
    const language = flags.language

    // Find and write language template
    const template = TEMPLATE_REGISTRY.getTemplate(language)
    if (!template) {
      throw new Error(`Language '${name}' not supported.`)
    }
    const isFunctionBundle = (await retrieveApiVersion(this.config.plugins)).startsWith('48.')
    template.write({fnDir: fnDir, fnName: fnName, fnNameCased: fnNameCased, isFunctionBundle: isFunctionBundle})

    this.log(`Created ${language} function ${herokuColor.green(fnName)} in ${herokuColor.green(fnDir)}.`)
  }
}
