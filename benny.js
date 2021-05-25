const path = require('path');
const process = require('process');
const config = require('./package.json').benny;

module.exports = class Benny {
  constructor() {
    this.name     = config.name;
    this.bucket   = config.bucket;
    this.platform = process.platform;
    this.version = config["major-version"];
  }

  suffix() {
    if (this.platform === 'win32') {
      return 'windows.exe'
    } else if (this.platform === 'darwin') {
      return 'darwin'
    } else if (this.platform === 'linux') {
      return 'linux'
    } else {
      throw new Error(`Unsupported platform: ${this.platform}`)
    }
  }

  get os() {
    const platform = this.suffix()
    if (platform === 'windows.exe')
      return 'windows'
    else
      return platform
  }

  majorVersion(){
    return this.version
  }

  get binDir() {
    return path.join(__dirname, 'bin');
  }

  get tmpDir(){
    return path.join(__dirname, 'tmp');
  }

  get keyDir() {
    return path.join(__dirname, 'priv');
  }

  get localFilename() {
    return `${this.name}-${this.suffix()}`
  }

  get localPath() {
    return process.env.BENNY_PATH || path.join(this.binDir, this.localFilename)
  }

  get tmpPath() {
    return path.join(this.binDir, `tmp-${this.localFilename}`)
  }

  get latestPath() {
    return path.join(this.tmpDir, 'latest.json')
  }

  get latestSigPath() {
    return path.join(this.tmpDir, 'latest.asc')
  }

  get publicKeyPath() {
    return path.join(this.keyDir, 'public.key')
  }

  get etagPath(){
    return path.join(this.tmpDir, 'etag')
  }

  get expirePath(){
    return path.join(this.tmpDir, 'expire')
  }

  get url(){
    return `https://${this.bucket}.s3.amazonaws.com/benny`
  }

  get latestUrl(){
    return `${this.url}/latest`
  }

  get latestSigUrl() {
    return `${this.url}/latest.asc`
  }
}
