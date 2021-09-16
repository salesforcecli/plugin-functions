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
  -b, --branch=<value>         Deploy the latest commit from a branch different from the currently active branch.
  -o, --connected-org=<value>  (required) Username or alias for the org that the compute environment should be connected
                               to.
  -q, --quiet                  Limit the amount of output displayed from the deploy process.
  --force                      Ignore warnings and overwrite remote repository (not allowed in production).
```

## `sf env create compute`

Create a compute environment for use with Salesforce Functions.

```
USAGE
  $ sf env create compute [-o <value>] [-a <value>]

FLAGS
  -a, --alias=<value>          Alias for the created environment.
  -o, --connected-org=<value>  Username or alias for the org that the compute environment should be connected to.

DESCRIPTION
  Create a compute environment for use with Salesforce Functions.

EXAMPLES
  $ sfdx env:create:compute

  $ sfdx env:create:compute --alias my-compute-environment

  $ sfdx env:create:compute --connected-org my-scratch-org
```

## `sf env delete`

Delete an environment.

```
USAGE
  $ sf env delete -c <value> [--confirm <value>]

FLAGS
  -c, --target-compute=<value>  (required) Environment name.
  --confirm=name...             Confirmation name.

DESCRIPTION
  Delete an environment.

EXAMPLES
  $ sfdx env:delete --target-compute=billingApp-Scratch1

  $ sfdx env:delete --target-compute=billingApp-Scratch1 --confirm=billingApp-Scratch1
```

## `sf env display`

Display details for an environment.

```
USAGE
  $ sf env display -c <value> [--json]

FLAGS
  -c, --target-compute=<value>  (required) Environment name.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Display details for an environment.

EXAMPLES
  $ sfdx env:display --target-compute=billingApp-Scratch1
```

## `sf env list`

List all environments by type.

```
USAGE
  $ sf env list [--all] [-t org|scratchorg|compute] [-j]

FLAGS
  -j, --json                         Output list in JSON format.
  -t, --target-env-type=<option>...  Filter by one or more environment types (org, scratchorg, compute).
                                     <options: org|scratchorg|compute>
  --all                              Show all available envs instead of scoping to active orgs and their connected
                                     compute envs.

DESCRIPTION
  List all environments by type.

EXAMPLES
  $ sfdx env:list

  $ sfdx env:list --all

  $ sfdx env:list --target-env-type org --target-env-type compute
```

## `sf env log tail`

Stream log output for an environment.

```
USAGE
  $ sf env log tail -c <value>

FLAGS
  -c, --target-compute=<value>  (required) Environment name to retrieve logs.

DESCRIPTION
  Stream log output for an environment.

EXAMPLES
  $ sfdx env:log:tail --target-compute=billingApp-Scratch1
```

## `sf env logdrain add`

Add log drain to a specified environment.

```
USAGE
  $ sf env logdrain add -c <value> -l <value>

FLAGS
  -c, --target-compute=<value>  (required) Environment name.
  -l, --drain-url=<value>       (required) Endpoint that will receive sent logs.

DESCRIPTION
  Add log drain to a specified environment.

EXAMPLES
  $ sfdx env:logdrain:add --target-compute=billingApp-Sandbox --drain-url=https://example.com/drain
```

## `sf env logdrain list`

List log drains connected to a specified environment.

```
USAGE
  $ sf env logdrain list -c <value> [-j]

FLAGS
  -c, --target-compute=<value>  (required) Environment name.
  -j, --json                    Output list in JSON format.

DESCRIPTION
  List log drains connected to a specified environment.

EXAMPLES
  $ sfdx env:logdrain:list --target-compute=billingApp-Sandbox
```

## `sf env logdrain remove`

Remove log drain from a specified environment.

```
USAGE
  $ sf env logdrain remove -c <value> -l <value>

FLAGS
  -c, --target-compute=<value>  (required) Environment name.
  -l, --drain-url=<value>       (required) Logdrain url to remove.

DESCRIPTION
  Remove log drain from a specified environment.

EXAMPLES
  $ sfdx env:logdrain:remove --target-compute=billingApp-Sandbox --drain-url=syslog://syslog-a.logdna.com:11137
```

## `sf env var get KEY`

display a single config value for an environment

```
USAGE
  $ sf env var get [KEY] -c <value>

FLAGS
  -c, --target-compute=<value>  (required) Environment name.

DESCRIPTION
  display a single config value for an environment

EXAMPLES
  $ sfdx env:var:get foo --target-compute=my-environment
```

## `sf env var list`

List your config vars in a table.

```
USAGE
  $ sf env var list -c <value>

FLAGS
  -c, --target-compute=<value>  (required) Environment name.

DESCRIPTION
  List your config vars in a table.

EXAMPLES
  $ sfdx env:var:list --target-compute=my-environment
```

## `sf env var set`

Sets a single config value for an environment.

```
USAGE
  $ sf env var set -c <value>

FLAGS
  -c, --target-compute=<value>  (required) Environment name.

DESCRIPTION
  Sets a single config value for an environment.

EXAMPLES
  $ sfdx env:var:set foo=bar --target-compute=my-environment
```

## `sf env var unset`

Unset a single config value for an environment.

```
USAGE
  $ sf env var unset -c <value>

FLAGS
  -c, --target-compute=<value>  (required) Environment name.

DESCRIPTION
  Unset a single config value for an environment.

EXAMPLES
  $ sfdx env:var:unset foo --target-compute=my-environment
```

## `sf generate function`

Create a function with basic scaffolding specific to a given language.

```
USAGE
  $ sf generate function -n <value> -L javascript|typescript|java

FLAGS
  -L, --language=(javascript|typescript|java)  (required) Language.
  -n, --function-name=<value>                  (required) Function name.

DESCRIPTION
  Create a function with basic scaffolding specific to a given language.

EXAMPLES
  $ sfdx generate:function --function-name=function-name --language=javascript
```

## `sf generate project`

```
USAGE
  $ sf generate project -n <value>

FLAGS
  -n, --project-name=<value>  (required) Name of the generated project.

EXAMPLES
  $ sfdx generate:project --project-name=project-name
```

## `sf login functions`

Log into your account.

```
USAGE
  $ sf login functions

DESCRIPTION
  Log into your account.

EXAMPLES
  $ sfdx login:functions
```

## `sf login functions jwt`

Login using JWT instead of default web-based flow. This will authenticate you with both sf and Salesforce Functions.

```
USAGE
  $ sf login functions jwt -u <value> -f <value> -i <value> [-l <value>] [--json] [-a <value>] [-d] [-v]

FLAGS
  -a, --alias=<value>         Alias for the org.
  -d, --set-default           Set the org as the default that all org-related commands run against.
  -f, --keyfile=<value>       (required) Path to JWT keyfile.
  -i, --clientid=<value>      (required) OAuth client ID.
  -l, --instance-url=<value>  The login URL of the instance the org lives on.
  -u, --username=<value>      (required) Authentication username.
  -v, --set-default-dev-hub   Set the org as the default Dev Hub for scratch org creation.
  --json                      format output as json

DESCRIPTION
  Login using JWT instead of default web-based flow. This will authenticate you with both sf and Salesforce Functions.

EXAMPLES
  $ sfdx login:functions:jwt --username testuser@mycompany.org --keyfile file.key --clientid 123456
```

## `sf run function`

Send a cloudevent to a function.

```
USAGE
  $ sf run function -l <value> [--json] [-H <value>] [-p <value>] [-s] [-o <value>]

FLAGS
  -H, --headers=<value>...     Set headers.
  -l, --function-url=<value>   (required) Url of the function to run.
  -o, --connected-org=<value>  Username or alias for the target org; overrides default target org.
  -p, --payload=<value>        Set the payload of the cloudevent. also accepts @file.txt format.
  -s, --structured             Set the cloudevent to be emitted as a structured cloudevent (json).

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Send a cloudevent to a function.

EXAMPLES
  $ sfdx run:function -l http://localhost:8080 -p '{"id": 12345}'

  $ sfdx run:function -l http://localhost:8080 -p '@file.json'

  $ echo '{"id": 12345}' | sfdx run:function -l http://localhost:8080

  $ sfdx run:function -l http://localhost:8080 -p '{"id": 12345}' --structured
```

## `sf run function start`

Build and run function image locally.

```
USAGE
  $ sf run function start [--json] [-p <value>] [-b <value>] [--clear-cache] [--no-pull] [-e <value>] [--network
    <value>] [-v]

FLAGS
  -b, --debug-port=<value>  [default: 9229] Port for remote debugging.
  -e, --env=<value>...      Set environment variables (provided during build and run).
  -p, --port=<value>        [default: 8080] Port for running the function.
  -v, --verbose             Output additional logs.
  --clear-cache             Clear associated cache before executing.
  --network=<value>         Connect and build containers to a network. This can be useful to build containers which
                            require a local resource.
  --no-pull                 Skip pulling builder image before use.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Build and run function image locally.

EXAMPLES
  $ sfdx run:function:start

  $ sfdx run:function:start -e VAR=VALUE

  $ sfdx run:function:start --network host --no-pull --clear-cache --debug-port 9000 --port 5000
```

## `sf whoami functions`

Show information on your account.

```
USAGE
  $ sf whoami functions [-j]

FLAGS
  -j, --json  Output list in JSON format.

DESCRIPTION
  Show information on your account.

EXAMPLES
  $ sf whoami functions
```

<!-- commandsstop -->
