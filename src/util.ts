import {ProjectDescriptor} from '@heroku/project-descriptor'
import {SfFunctionCommand, OutputEvent} from '@salesforce/functions-core'
import {cli} from 'cli-ux'

namespace Util {
  export function isUUID(spaceId: string): boolean {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const match = spaceId.match(UUID_REGEX)

    return Boolean(match) && match?.length === 1
  }

  export async function getProjectDescriptor(path: string): Promise<any> {
    const projectTOML = new ProjectDescriptor()
    try {
      return await projectTOML.parseFile(path)
    } catch (error) {
      if (error.message.includes('File Not Found')) {
        throw new Error(error.message + '\n Hint: Are you in the correct working directory?')
      } else {
        throw error
      }
    }
  }

  export function outputSfFunctionCommandEvents(command: SfFunctionCommand) {
    const types: string[] = ['error', 'warn', 'debug', 'log']
    types.forEach((event:string) => {
      command.on(event as OutputEvent, (data:string) => {
        // Have to reassign cli to the type of any to dodge TypeScript errors
        const cliA:any = cli
        // Calls cli.debug, cli.error, cli.warn etc accordingly
        cliA[event](data)
      })
    })
    command.on('json', (data:string) => {
      cli.styledJSON(data)
    })
    command.on('start_action', (data:string) => {
      cli.action.start(data)
    })

    command.on('stop_action', (data:string) => {
      cli.action.stop(data)
    })
  }
}

export default Util
