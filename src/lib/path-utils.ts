import {pathExists, readdir, lstatSync} from 'fs-extra'
import * as path from 'path'

const PROJECT_JSON = 'sfdx-project.json'
const FUNCTIONS_DIR = 'functions'

export async function reverseWalk(fileName: string, iterations = 10): Promise<string | null> {
  if (iterations === 0) {
    return null
  }

  if (await pathExists(fileName)) {
    return fileName
  }

  return reverseWalk(path.join('..', fileName), iterations - 1)
}

export async function resolveSfdxProjectPath(projectJson = PROJECT_JSON) {
  const projectPath = await reverseWalk(projectJson)

  if (!projectPath) {
    throw new Error('No sfdx project found.')
  }

  return projectPath
}

export async function resolveFunctionsDirectory() {
  const sfdxProjectPath = await resolveSfdxProjectPath()

  return sfdxProjectPath.replace(PROJECT_JSON, FUNCTIONS_DIR)
}

export async function resolveFunctionsPaths() {
  const fnDir = await resolveFunctionsDirectory()

  const functions = await readdir(fnDir)

  return functions.reduce((acc: Array<string>, fn: string) => {
    const fnPath = path.join(fnDir, fn)
    if (lstatSync(fnPath).isDirectory()) {
      acc.push(fnPath)
    }

    return acc
  }, [])
}
