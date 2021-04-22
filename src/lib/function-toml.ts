import {FunctionToml} from '@heroku/function-toml'
import {cli} from 'cli-ux'

export async function parseFunctionToml(fnTomlPath: string): Promise<any> {
  const toml = new FunctionToml()
  try {
    return await toml.parseFile(fnTomlPath)
  } catch (error) {
    if (error.message.includes('File Not Found')) {
      cli.error(error.message + ' Are you in the correct working directory?')
    } else {
      cli.error(error.message)
    }
  }
}
