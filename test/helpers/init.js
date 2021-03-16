const chalk = require('chalk')
chalk.enabled = false
process.env.FORCE_COLOR = '0'
process.stdout.columns = 80
process.stderr.columns = 80
process.env.CLI_UX_SKIP_TTY_CHECK = true
