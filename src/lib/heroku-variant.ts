export function herokuVariant(variantName: string) {
  return {
    Accept: `application/vnd.heroku+json; version=3.${variantName}`,
  }
}

export default herokuVariant
