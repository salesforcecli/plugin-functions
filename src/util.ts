namespace Util {
  export function isUUID(spaceId: string): boolean {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const match = spaceId.match(UUID_REGEX)

    return Boolean(match) && match?.length === 1
  }
}

export default Util
