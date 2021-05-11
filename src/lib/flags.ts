import {flags} from '@oclif/command'
import {CLIError} from '@oclif/errors'
import {IBooleanFlag} from '@oclif/parser/lib/flags'
import {cli} from 'cli-ux'

export namespace FunctionsFlagBuilder {
  export const environment = flags.build({
    char: 'e',
    description: 'environment name',
    required: true,
  })

  export const environmnetType = flags.build({
    char: 't',
    description: 'filter by one or more environment types (org, scratchorg, compute)',
    options: ['org', 'scratchorg', 'compute'],
    multiple: true,
  })

  export const connectedOrg = flags.build({
    char: 'o',
    description: 'username or alias for the org that the compute environment should be connected to',
    required: false,
  })

  export const confirmationFlag = flags.string({
    char: 'c',
    required: false,
    description: 'confirmation name',
    helpValue: 'name',
    multiple: true,
  })

  export const keyValueFlag = flags.build({
    description: 'key-value pair (i.e. mykey=somevalue)',
    parse(input) {
      const [key, ...rest] = input.split('=')
      const value = rest.join('=')

      if (!value) {
        throw new CLIError(`--${this.name}=${input} must be a valid key-value pair (i.e. mykey=somevalue)`)
      }

      return {key, value}
    },
  })

  export const waitFlag = flags.boolean({
    char: 'w',
    required: false,
    description: 'wait until complete to exit',
  }) as IBooleanFlag<'boolean'>

  export const FunctionsTableFlags: flags.Input<any> = {
    // only let supertable alternatively
    // output in json & csv for now
    ...cli.table.flags({except: ['csv', 'output']}),
    output: flags.string({
      exclusive: ['no-truncate', 'csv'],
      description: 'output table in a more machine friendly format',
      options: ['json', 'csv'],
    }),
  }
}
