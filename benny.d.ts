declare class Benny {
  binDir: string

  tmpDir: string

  keyDir: string

  name: string

  localPath: string

  tmpPath: string

  latestPath: string

  latestSigPath: string

  publicKeyPath: string

  etagPath: string

  expirePath: string

  latestUrl: string

  latestSigUrl: string

  bucket: string

  suffix(): string

  majorVersion(): string

  os: string
}

export = Benny
