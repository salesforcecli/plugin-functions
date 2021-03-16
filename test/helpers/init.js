const {color} = require('@heroku-cli/color')
const chai = require('chai')
const sinonChai = require('sinon-chai')

chai.use(sinonChai)

color.enabled = false
process.env.FORCE_COLOR = '0'

process.stdout.columns = 80
process.stderr.columns = 80

process.env.CLI_UX_SKIP_TTY_CHECK = true
process.env.NODE_ENV = 'development'
