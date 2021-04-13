export function herokuVariant(variantName: string) {
  return `application/vnd.heroku+json; version=3.${variantName}`
}

export default herokuVariant
