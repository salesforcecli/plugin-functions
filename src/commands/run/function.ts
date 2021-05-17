import herokuColor from '@heroku-cli/color'
import {Command, flags} from '@oclif/command'
import {Config, Connection, Org} from '@salesforce/core'
import axios, {AxiosResponse} from 'axios'
import {cli} from 'cli-ux'
import {HTTP, CloudEvent} from 'cloudevents'
import {default as CE_CONSTANTS} from 'cloudevents/dist/constants'
import * as fs from 'fs'
import * as getStdin from 'get-stdin'
import {v4 as uuid} from 'uuid'

import {updateBenny} from '../../install-benny'

export default class Invoke extends Command {
  static description = 'send a cloudevent to a function'

  static examples = [`
    $ sfdx run:function -u http://localhost:8080 -p '{"id": 12345}'
    $ sfdx run:function -u http://localhost:8080 -p '@file.json'
    $ echo '{"id": 12345}' | sfdx run:function -u http://localhost:8080
    $ sfdx run:function -u http://localhost:8080 -p '{"id": 12345}' --structured
`,
  ]

  static flags = {
    url: flags.string({
      char: 'u',
      description: 'url of the function to run',
      required: true
    }),
    headers: flags.string({
      char: 'H',
      description: 'set headers',
      multiple: true
    }),
    payload: flags.string({
      char: 'p',
      description: 'set the payload of the cloudevent. also accepts @file.txt format'
    }),
    structured: flags.boolean({
      description: 'set the cloudevent to be emitted as a structured cloudevent (json)'
    }),
    targetusername: flags.string({
      char: 't',
      description: 'username or alias for the target org; overrides default target org'
    }),
  }

  private static readonly HEADER_REQUEST = 'X-Request-Id'

  async run() {
    const {flags} = this.parse(Invoke)

    const data = await this.getPayloadData(flags.payload)
    if (!data) {
      this.error('no payload provided (provide via stdin or -p)')
      return
    }

    await updateBenny()

    try {
      cli.action.start(`${herokuColor.cyanBright('POST')} ${flags.url}`)
      const cloudevent = await this.buildCloudevent(data!, flags.targetusername, flags.structured)
      const response = await this.sendRequest(cloudevent, flags.url, flags.headers, flags.structured)
      cli.action.stop(herokuColor.greenBright(response.status.toString()))
      this.writeResponse(response)
    } catch (err) {
      this.debug(err)
      if (err.response) {
        cli.action.stop(herokuColor.redBright(`${err.response.status} ${err.response.statusText}`))
        this.debug(err.response)
        this.error(err.response.data)
      } else {
        cli.action.stop(herokuColor.redBright('Error'))
        this.error(err)
      }
    }
  }

  async buildSfContexts(targetusername: string | undefined, requestId: string): Promise<object> {
    try {
      // auth to scratch org using targetusername
      const org: Org = await Org.create({
        aliasOrUsername: targetusername
      })

      const aliasOrUser = targetusername || `defaultusername ${org.getConfigAggregator().getInfo(Config.DEFAULT_USERNAME).value}`
      this.log(`Using ${aliasOrUser} login credential to initialize context`)

      // refresh to get the access Token
      await org.refreshAuth()

      const orgusername = org.getUsername()
      const orgId18 = org.getOrgId().slice(0, 18)
      const connection: Connection = org.getConnection()

      const userContext = {
        salesforceBaseUrl: connection.instanceUrl,
        orgId: orgId18,
        orgDomainUrl: connection.instanceUrl,
        username: orgusername || '',
        userId: connection.getAuthInfoFields().userId || '',     // userId may not be set
        onBehalfOfUserId: ''    // onBehalfOfUserId not set
      }

      const sfcontext = Buffer.from(JSON.stringify({
        apiVersion: connection.version,
        payloadVersion: 'invoke-v0.1',
        userContext
      })).toString('base64')

      const sffncontext = Buffer.from(JSON.stringify({
        accessToken: connection.accessToken,
        requestId
      })).toString('base64')

      return {sfcontext, sffncontext}
    } catch (err) {
      if (err.name === 'AuthInfoCreationError' || err.name === 'NoUsername') {
        this.warn('No -t targetusername or defaultusername found, context will be partially initialized')
        return {}
      }
      throw err
    }
  }

  async getPayloadData(payload: string | undefined): Promise<string | undefined> {
    if (payload && payload.startsWith('@')) {
      return fs.readFileSync(payload.slice(1), 'utf8')
    } else {
      return payload || getStdin()
    }
  }

  async buildCloudevent(userdata: string, targetusername: string | undefined, structured: boolean): Promise<CloudEvent> {
    let requestId: string = uuid()
    let data: Buffer | string | object = this.toCloudEventData(userdata, structured)

    // Base64(JSON) encoded `sfcontext` and `sffncontext` keys/values if possible.  Empty object otherwise.
    const contexts: {} = await this.buildSfContexts(targetusername, requestId)

    // Create a Cloudevent 1.0-compliant object with sfcontext and sffncontext extensions
    return new CloudEvent({
      id: requestId,
      specversion: '1.0',
      source: 'urn:event:from:local',
      type: 'com.evergreen.functions.test',
      subject: 'test-subject',
      datacontenttype: 'application/json; charset=utf-8',
      ...contexts,
      data
    })
  }

  async sendRequest(cloudevent: CloudEvent, url: string, headers: any, structured: boolean): Promise<AxiosResponse> {
    const sendHeaders = this.buildRequestHeaders(headers, cloudevent.id, structured) // rm structured?
    // formerly protocol: structured ? 1 : 0
    let protocolFn = structured ? HTTP.structured : HTTP.binary
    const message = protocolFn(cloudevent)

    return axios({
      method: "post",
      url: url,
      data: message.body,
      headers: sendHeaders, // RFC: use message.headers?
    })
  }

  buildRequestHeaders(headers: any, requestId: string, structured: boolean): any {
    const requestHeaders = {} as any

    if (headers) {
      headers.forEach((h: any) => {
        const headerSplits = h.split(':')
        requestHeaders[headerSplits[0]] = headerSplits[1]
      })
    }

    // set the request id header to be used by function logger initialization
    requestHeaders[Invoke.HEADER_REQUEST] = requestId

    // set structured cloudevents content-type if needed, should be handled by StructuredEmitter - bug?
    if (structured) {
      requestHeaders[CE_CONSTANTS.HEADER_CONTENT_TYPE] = CE_CONSTANTS.DEFAULT_CE_CONTENT_TYPE // this is no longer needed in 4.0?
    }

    return requestHeaders
  }

  // wrap userdata as a Buffer if sending via HttpBinary (!structured), optionally json-
  // escaping before wrapping.
  bufferIfHttpBinary(userdata: string, structured: boolean, escape: boolean): Buffer | string {
    return structured ? userdata : Buffer.from(escape ? JSON.stringify(userdata) : userdata, 'utf-8')
  }

  // CloudEvents 1.0 data element must be either a well-formed JSON `object` or a properly-
  // quoted JSON `string`.  Try to parse into JSON object first - if parsing fails or we
  // get an unsupported type (boolean or number), return as a properly-escaped string.
  // When sending via HTTPBinary (!structure), that properly-escaped string must be in a Buffer
  // to be posted without modification by the cloudevents http binary emitter.
  toCloudEventData(userdata: string, structured: boolean): Buffer | string | object {
    let eventData: Buffer | string | object
    try {
      const parsedData = JSON.parse(userdata)
      // tslint:disable-next-line:triple-equals
      if (typeof parsedData === 'object' && parsedData != null) {
        // successfully parsed as js object that will be serialized properly as cloudevents data
        eventData = parsedData
      } else if (typeof parsedData === 'string') {
        // successfully parsed a json-quoted string, wrap original userdata string w/buffer
        eventData = this.bufferIfHttpBinary(userdata, structured, false)
      } else {
        // other types like boolean or number should be json-escaped
        this.debug(`payload data not string|object (${typeof parsedData}), treating as string`)
        eventData = this.bufferIfHttpBinary(userdata, structured, true)
      }
    } catch (parseErr) {
      this.debug(`payload data not parseable as json, treating as string: ${parseErr}`)
      // If given a raw string that was not json, escape/buffer if necessary
      eventData = this.bufferIfHttpBinary(userdata, structured, true)
    }
    return eventData
  }

  writeResponse(response: AxiosResponse) {
    const contentType = response.headers['content-type']
    if (contentType.includes('application/json') ||
      contentType.includes('application/cloudevents+json')) {
      cli.styledJSON(response.data)
    } else {
      this.log(response.data)
    }
  }
}
