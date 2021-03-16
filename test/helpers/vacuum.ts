export default function vacuum(str: string): string
export default function vacuum(strings: TemplateStringsArray): string
export default function vacuum(str: any): string {
  if (Array.isArray(str)) {
    return vacuum(str[0])
  }

  return str
  .trim()
  .replace(/^ +/mg, '')
  .replace(/ +$/mg, '')
  .replace(/ +/mg, ' ')
}
