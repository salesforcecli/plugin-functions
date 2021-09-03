# plugin-functions

Functions plugin for the SF CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![NPM](https://img.shields.io/npm/v/@salesforce/plugin-functions.svg?label=@salesforce/functions)](https://www.npmjs.com/package/@salesforce/functions) [![CircleCI](https://circleci.com/gh/salesforcecli/plugin-functions/tree/main.svg?style=shield)](https://circleci.com/gh/salesforcecli/plugin-functions/tree/main) [![Downloads/week](https://img.shields.io/npm/dw/@salesforce/plugin-functions.svg)](https://npmjs.org/package/@salesforce/plugin-functions) [![License](https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg)](https://raw.githubusercontent.com/salesforcecli/plugin-functions/main/LICENSE.txt)

<!-- toc -->

- [plugin-functions](#plugin-functions)
- [Usage](#usage)
- [Commands](#commands)
<!-- tocstop -->

# Usage

1. Install the SFDX CLI: [Install instructions](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_install_cli.htm)
2. Then run `sfdx plugins:install @salesforce/plugin-functions`:

```sh-session
$ sfdx plugins:install @salesforce/plugin-functions
running command...
```

Now you should be able to run functions commands, e.g. `sfdx env:list`, `sfdx login:functions`

# Commands

<!-- commands -->

- [`sf deploy functions`](#sf-deploy-functions)
- [`sf env create compute`](#sf-env-create-compute)
- [`sf env delete`](#sf-env-delete)
- [`sf env display`](#sf-env-display)
- [`sf env list`](#sf-env-list)
- [`sf env log tail`](#sf-env-log-tail)
- [`sf env logdrain add`](#sf-env-logdrain-add)
- [`sf env logdrain list`](#sf-env-logdrain-list)
- [`sf env logdrain remove`](#sf-env-logdrain-remove)
- [`sf env var get KEY`](#sf-env-var-get-key)
- [`sf env var list`](#sf-env-var-list)
- [`sf env var set`](#sf-env-var-set)
- [`sf env var unset`](#sf-env-var-unset)
- [`sf generate function`](#sf-generate-function)
- [`sf generate project`](#sf-generate-project)
- [`sf login functions`](#sf-login-functions)
- [`sf login functions jwt`](#sf-login-functions-jwt)
- [`sf run function`](#sf-run-function)
- [`sf run function start`](#sf-run-function-start)
- [`sf whoami functions`](#sf-whoami-functions)

## `sf deploy functions`

```
USAGE
  $ sf deploy functions -o <value> [-b <value>] [--force] [-q]

FLAGS
  -b, --branch=<value>         deploy the latest commit from a branch different from the currently active branch

  -o, --connected-org=<value>  (required) username or alias for the org that the compute environment should be connected
                               to

  -q, --quiet                  limit the amount of output displayed from the deploy process

  --force                      ignore warnings and overwrite remote repository (not allowed in production)

ALIASES
  $ sf project deploy functions
```

## `sf env create compute`

create a compute environment for use with Salesforce Functions

```
USAGE
  $ sf env create compute [-o <value>] [-a <value>]

FLAGS
  -a, --setalias=<value>       alias for the created environment
  -o, --connected-org=<value>  username or alias for the org that the compute environment should be connected to

DESCRIPTION
  create a compute environment for use with Salesforce Functions

EXAMPLES
  $ sfdx env:create:compute

  $ sfdx env:create:compute --setalias my-compute-environment

  $ sfdx env:create:compute --connected-org my-scratch-org
```

## `sf env delete`

delete an environment

```
USAGE
  $ sf env delete -e <value> [-c <value>]

FLAGS
  -c, --confirm=name...      confirmation name
  -e, --environment=<value>  (required) environment name

DESCRIPTION
  delete an environment

EXAMPLES
  $ sfdx env:delete --environment=billingApp-Scratch1

  $ sfdx env:delete --environment=billingApp-Scratch1 --confirm=billingApp-Scratch1
```

## `sf env display`

display details for an environment

```
USAGE
  $ sf env display -e <value> [--json]

FLAGS
  -e, --environment=<value>  (required) environment name

GLOBAL FLAGS
  --json  format output as json

DESCRIPTION
  display details for an environment

EXAMPLES
  $ sfdx env:display --environment=billingApp-Scratch1
```

## `sf env list`

List all environments by type

```
USAGE
  $ sf env list [--all] [-t org|scratchorg|compute] [-j]

FLAGS
  -j, --json                          output list in JSON format

  -t, --environment-type=<option>...  filter by one or more environment types (org, scratchorg, compute)
                                      <options: org|scratchorg|compute>

  --all                               show all available envs instead of scoping to active orgs and their connected
                                      compute envs

DESCRIPTION
  List all environments by type

EXAMPLES
  $ sfdx env:list

  $ sfdx env:list --all

  $ sfdx env:list --environment-type org --environment-type compute
```

## `sf env log tail`

stream log output for an environment

```
USAGE
  $ sf env log tail -e <value>

FLAGS
  -e, --environment=<value>  (required) environment name to retrieve logs

DESCRIPTION
  stream log output for an environment

EXAMPLES
  $ sfdx env:log:tail --environment=billingApp-Scratch1
```

## `sf env logdrain add`

Add log drain to a specified environment

```
USAGE
  $ sf env logdrain add -e <value> -u <value>

FLAGS
  -e, --environment=<value>  (required) environment name
  -u, --url=<value>          (required) endpoint that will receive sent logs

DESCRIPTION
  Add log drain to a specified environment

EXAMPLES
  $ sfdx env:logdrain:add --environment=billingApp-Sandbox --url=https://example.com/drain
```

## `sf env logdrain list`

List log drains connected to a specified environment

```
USAGE
  $ sf env logdrain list -e <value> [--json]

FLAGS
  -e, --environment=<value>  (required) environment name
  --json                     output result in json

DESCRIPTION
  List log drains connected to a specified environment

EXAMPLES
  $ sfdx env:logdrain:list --environment=billingApp-Sandbox
```

## `sf env logdrain remove`

Remove log drain from a specified environment.

```
USAGE
  $ sf env logdrain remove -e <value> -u <value>

FLAGS
  -e, --environment=<value>  (required) environment name
  -u, --url=<value>          (required) logdrain url to remove

DESCRIPTION
  Remove log drain from a specified environment.

EXAMPLES
  $ sfdx env:logdrain:remove --environment=billingApp-Sandbox --url=syslog://syslog-a.logdna.com:11137
```

## `sf env var get KEY`

display a single config value for an environment

```
USAGE
  $ sf env var get [KEY] -e <value>

FLAGS
  -e, --environment=<value>  (required) environment name

DESCRIPTION
  display a single config value for an environment

EXAMPLES
  $ sfdx env:var:get foo --environment=my-environment
```

## `sf env var list`

list your config vars in a table

```
USAGE
  $ sf env var list -e <value>

FLAGS
  -e, --environment=<value>  (required) environment name

DESCRIPTION
  list your config vars in a table

EXAMPLES
  $ sfdx env:var:list --environment=my-environment
```

## `sf env var set`

sets a single config value for an environment

```
USAGE
  $ sf env var set -e <value>

FLAGS
  -e, --environment=<value>  (required) environment name

DESCRIPTION
  sets a single config value for an environment

EXAMPLES
  $ sfdx env:var:set foo=bar --environment=my-environment
```

## `sf env var unset`

unset a single config value for an environment

```
USAGE
  $ sf env var unset -e <value>

FLAGS
  -e, --environment=<value>  (required) environment name

DESCRIPTION
  unset a single config value for an environment

EXAMPLES
  $ sfdx env:var:unset foo --environment=my-environment
```

## `sf generate function`

create a function with basic scaffolding specific to a given language

```
USAGE
  $ sf generate function -n <value> -l javascript|typescript|java

FLAGS
  -l, --language=(javascript|typescript|java)  (required) language
  -n, --name=<value>                           (required) function name

DESCRIPTION
  create a function with basic scaffolding specific to a given language

ALIASES
  $ sf evergreen function init

EXAMPLES
  $ sfdx evergreen:function:create MyFunction --language=javascript
```

## `sf generate project`

```
USAGE
  $ sf generate project -n <value>

FLAGS
  -n, --name=<value>  (required) name of the generated project
```

## `sf login functions`

log into your account

```
USAGE
  $ sf login functions

DESCRIPTION
  log into your account

EXAMPLES
  $ sfdx login:functions
```

## `sf login functions jwt`

login using JWT instead of default web-based flow

```
USAGE
  $ sf login functions jwt -u <value> -f <value> -i <value> [-r <value>]

FLAGS
  -f, --keyfile=<value>      (required) path to JWT keyfile
  -i, --clientid=<value>     (required) OAuth client ID
  -r, --instanceurl=<value>  the login URL of the instance the org lives on
  -u, --username=<value>     (required) authentication username

DESCRIPTION
  login using JWT instead of default web-based flow

EXAMPLES
  $ sfdx login:functions:jwt --username testuser@mycompany.org --keyfile file.key --clientid 123456
```

## `sf run function`

send a cloudevent to a function

```
USAGE
  $ sf run function -l <value> [--json] [-H <value>] [-p <value>] [-s] [-o <value>]

FLAGS
  -H, --headers=<value>...     set headers
  -l, --url=<value>            (required) url of the function to run
  -o, --connected-org=<value>  username or alias for the target org; overrides default target org
  -p, --payload=<value>        set the payload of the cloudevent. also accepts @file.txt format
  -s, --structured             set the cloudevent to be emitted as a structured cloudevent (json)

GLOBAL FLAGS
  --json  format output as json

DESCRIPTION
  send a cloudevent to a function

EXAMPLES
      $ sfdx run:function -l http://localhost:8080 -p '{"id": 12345}'
      $ sfdx run:function -l http://localhost:8080 -p '@file.json'
      $ echo '{"id": 12345}' | sfdx run:function -l http://localhost:8080
      $ sfdx run:function -l http://localhost:8080 -p '{"id": 12345}' --structured
```

## `sf run function start`

build and run function image locally

```
USAGE
  $ sf run function start [--json] [-p <value>] [-d <value>] [--clear-cache] [--no-pull] [-e <value>] [--network
    <value>] [-v]

FLAGS
  -d, --debug-port=<value>  [default: 9229] port for remote debugging
  -e, --env=<value>...      set environment variables (provided during build and run)
  -p, --port=<value>        [default: 8080] port for running the function
  -v, --verbose             output additional logs
  --clear-cache             clear associated cache before executing.

  --network=<value>         Connect and build containers to a network. This can be useful to build containers which
                            require a local resource.

  --no-pull                 skip pulling builder image before use

GLOBAL FLAGS
  --json  format output as json

DESCRIPTION
  build and run function image locally

EXAMPLES
      $ sfdx run:function:start
      $ sfdx run:function:start -e VAR=VALUE
      $ sfdx run:function:start --network host --no-pull --clear-cache --debug-port 9000 --port 5000
```

## `sf whoami functions`

show information on your account

```
USAGE
  $ sf whoami functions

DESCRIPTION
  show information on your account

EXAMPLES
  $ sf whoami functions
```

<!-- commandsstop -->
