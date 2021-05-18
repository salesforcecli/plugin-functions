import netrc from 'netrc-parser'

export default class NetrcMachine {
  // eslint-disable-next-line no-useless-constructor
  constructor(private readonly machine: string) {}

  get(key: string) {
    const machineData = this.loadMachine()
    const value = machineData[key]

    if (!value) {
      return undefined
    }

    return value
  }

  async set(key: string, value?: string) {
    if (key !== 'password') {
      console.log(`setting ${key} to ${value} on ${this.machine}`)
    }

    const machineData = this.loadMachine()

    const machinePayload = {
      ...machineData,
      [key]: value,
    }

    await this.saveMachine(machinePayload)
    return value
  }

  async delete() {
    this.get('password') && delete netrc.machines[this.machine] && netrc.save()
  }

  private async saveMachine(machinePayload: {[key: string]: string | undefined}) {
    const machine = this.machine
    netrc.machines[machine] = machinePayload

    await netrc.save()
  }

  private loadMachine() {
    const machine = this.machine
    netrc.loadSync()
    const netrcData = netrc.machines[machine] || {}
    return netrcData
  }
}
