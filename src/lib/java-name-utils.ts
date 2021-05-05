export function toJavaClassName(input: string): string {
  const preliminaryResult = input
  .replace(/[^A-Za-z0-9 ]/g, '')
  .split(' ')
  .map(match => match.charAt(0).toUpperCase() + match.substring(1))
  .join('')

  if (preliminaryResult.match(/^\d/)) {
    return 'A' + preliminaryResult
  }

  return preliminaryResult
}

export function toMavenArtifactId(input: string): string {
  return input
  .replace(/[^A-Za-z0-9- ]/g, '') // Remove illegal characters
  .replace(/((?<!^| |[A-Z])[A-Z])/g, match => ' ' + match) // Expand camel-case to separate words
  .replace(/ +/, ' ')
  .split(' ')
  .map(match => match.toLowerCase())
  .join('-')
}
