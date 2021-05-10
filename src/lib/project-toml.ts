import {ProjectDescriptor} from '@heroku/project-descriptor'
import {cli} from 'cli-ux'

export async function parseProjectToml(fnTomlPath: string): Promise<any> {
  const parser = new ProjectDescriptor()
  try {
    return await parser.parseFile(fnTomlPath)
  } catch (error) {
    if (error.message.includes('File Not Found')) {
      cli.error(error.message + ' Are you in the correct working directory?')
    } else {
      cli.error(error.message)
    }
  }
}
