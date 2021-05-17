import {ChildProcess, spawn} from 'child_process'
import DebugFactory from 'debug'
import * as events from 'events'
import {createInterface} from 'readline'

import JSBenny = require('../benny.js')

const debug = DebugFactory('evergreen:benny:message')

export default class Benny {
  private readonly binPath: string

  private readonly emitter: events.EventEmitter

  constructor() {
    this.binPath = (new JSBenny().localPath)
    this.emitter = new events.EventEmitter()
  }

  on(event: string | symbol, listener: (...args: any[]) => void) {
    this.getEmitter().on(event, listener)
  }

  build(image: string, options: {[key: string]: any}) {
    const buildArgs: Array<string> = [
      'build',
      image,
    ]

    Object.entries(options).forEach(([flagName, flagVal]) => {
      if (flagName === 'verbose') return
      if (flagVal === undefined) return
      if (Array.isArray(flagVal)) {
        flagVal.forEach((arrVal: any) => {
          buildArgs.push(`--${flagName}`)
          buildArgs.push(arrVal)
        })
      } else if (flagVal !== true) {
        buildArgs.push(`--${flagName}`)
        buildArgs.push(flagVal)
      } else {
        buildArgs.push(`--${flagName}`)
      }
    })

    return this.exec(buildArgs)
  }

  run(containerName: string, flags: {
    port: number | undefined;
    'debug-port': number | undefined;
    env: string[];
  }) {
    const runArgs = [
      'run',
      containerName,
    ]
    if (flags.port) {
      runArgs.push('--port')
      runArgs.push(flags.port.toString())
    }

    if (flags['debug-port'] !== undefined) {
      runArgs.push('--debug-port')
      runArgs.push(flags['debug-port'].toString() || '')
    }

    if (flags.env) {
      flags.env.forEach((env: string) => {
        runArgs.push('-e')
        runArgs.push(env)
      })
    }
    return this.exec(runArgs)
  }

  push(image: string, spaceId: string, registryPassword: string) {
    const pushArgs = [
      'push',
      image,
      '--space-id',
      spaceId,
    ]

    return this.exec(pushArgs, registryPassword)
  }

  private async exec(args: string[], input?: any) {
    debug(this.binPath, args)
    const cmd = spawn(this.binPath, args)

    this.handleInput(input, cmd)

    const rl = createInterface({
      input: cmd.stdout,
      crlfDelay: Infinity,
    })

    rl.on('line', (line: any) => {
      debug(line)
      const payload = JSON.parse(line)
      this.getEmitter().emit('message', payload)

      if (payload.type) {
        this.getEmitter().emit(payload.type, payload)
      }
    })

    // return a promise that resolves when the child process has exited
    return new Promise(function (resolve, reject) {
      cmd.addListener('error', reject)
      cmd.addListener('exit', code => {
        if (code !== 0) {
          reject(new Error('Build exited with: ' + cmd.stderr.read()))
        } else {
          resolve(code)
        }
      })
    })
  }

  private handleInput(input: any, command: ChildProcess) {
    if (!input) return

    const isStream = typeof input === 'object' &&
      typeof input.pipe === 'function'
    if (isStream) {
      input.pipe(command.stdin)
    } else {
      command.stdin?.end(input)
    }
  }

  private getEmitter() {
    return this.emitter
  }
}
