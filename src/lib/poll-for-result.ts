import cli from 'cli-ux'

/* eslint-disable no-await-in-loop */
export default async function pollForResult(fn: () => Promise<boolean>, timeout = 1000) {
  while (!await fn()) {
    await cli.wait(timeout)
  }

  return true
}
