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

1. Install the SF CLI: [Install instructions](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_install_cli.htm)
2. Then run `sf plugins:install @salesforce/plugin-functions`:

```sh-session
$ sf plugins:install @salesforce/plugin-functions
running command...
```

Now you should be able to run functions commands, e.g. `sf generate project`, `sf login functions`

# Commands

<!-- commands -->

- [`sf deploy functions`](#sf-deploy-functions)
- [`sf env create compute`](#sf-env-create-compute)
- [`sf env delete`](#sf-env-delete)
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
  -a, --setalias=<value>       Alias for the created environment.
  -o, --connected-org=<value>  Username or alias for the org that the compute environment should be connected to.

DESCRIPTION
  Create a compute environment for use with Salesforce Functions.

EXAMPLES
  $ sfdx env:create:compute

  $ sfdx env:create:compute --setalias my-compute-environment

  $ sfdx env:create:compute --connected-org my-scratch-org
```

## `sf env delete`

Delete an environment.

```
USAGE
  $ sf env delete -e <value> [-c <value>]

FLAGS
  -c, --confirm=name...      Confirmation name.
  -e, --environment=<value>  (required) Environment name.

DESCRIPTION
  Delete an environment.

EXAMPLES
  $ sfdx env:delete --environment=billingApp-Scratch1

  $ sfdx env:delete --environment=billingApp-Scratch1 --confirm=billingApp-Scratch1
```

## `sf env log tail`

Stream log output for an environment.

```
USAGE
  $ sf env log tail -e <value>

FLAGS
  -e, --environment=<value>  (required) Environment name to retrieve logs.

DESCRIPTION
  Stream log output for an environment.

EXAMPLES
  $ sfdx env:log:tail --environment=billingApp-Scratch1
```

## `sf env logdrain add`

Add log drain to a specified environment.

```
USAGE
  $ sf env logdrain add -e <value> -u <value>

FLAGS
  -e, --environment=<value>  (required) Environment name.
  -u, --url=<value>          (required) Endpoint that will receive sent logs.

DESCRIPTION
  Add log drain to a specified environment.

EXAMPLES
  $ sfdx env:logdrain:add --environment=billingApp-Sandbox --url=https://example.com/drain
```

## `sf env logdrain list`

List log drains connected to a specified environment.

```
USAGE
  $ sf env logdrain list -e <value> [-j]

FLAGS
  -e, --environment=<value>  (required) Environment name.
  -j, --json                 Output list in JSON format.

DESCRIPTION
  List log drains connected to a specified environment.

EXAMPLES
  $ sfdx env:logdrain:list --environment=billingApp-Sandbox
```

## `sf env logdrain remove`

Remove log drain from a specified environment.

```
USAGE
  $ sf env logdrain remove -e <value> -u <value>

FLAGS
  -e, --environment=<value>  (required) Environment name.
  -u, --url=<value>          (required) Logdrain url to remove.

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
  -e, --environment=<value>  (required) Environment name.

DESCRIPTION
  display a single config value for an environment

EXAMPLES
  $ sfdx env:var:get foo --environment=my-environment
```

## `sf env var list`

List your config vars in a table.

```
USAGE
  $ sf env var list -e <value> [-j]

FLAGS
  -e, --environment=<value>  (required) Environment name.
  -j, --json                 Output list in JSON format.

DESCRIPTION
  List your config vars in a table.

EXAMPLES
  $ sfdx env:var:list --environment=my-environment
```

## `sf env var set`

Sets a single config value for an environment.

```
USAGE
  $ sf env var set -e <value>

FLAGS
  -e, --environment=<value>  (required) Environment name.

DESCRIPTION
  Sets a single config value for an environment.

EXAMPLES
  $ sfdx env:var:set foo=bar --environment=my-environment
```

## `sf env var unset`

Unset a single config value for an environment.

```
USAGE
  $ sf env var unset -e <value>

FLAGS
  -e, --environment=<value>  (required) Environment name.

DESCRIPTION
  Unset a single config value for an environment.

EXAMPLES
  $ sfdx env:var:unset foo --environment=my-environment
```

## `sf generate function`

Create a function with basic scaffolding specific to a given language.

```
USAGE
  $ sf generate function -n <value> -l javascript|typescript|java

FLAGS
  -l, --language=(javascript|typescript|java)  (required) Language.
  -n, --name=<value>                           (required) Function name.

DESCRIPTION
  Create a function with basic scaffolding specific to a given language.

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
  -n, --name=<value>  (required) Name of the generated project.
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
  $ sf login functions jwt -u <value> -f <value> -i <value> [-l <value> | ] [--json] [-a <value>] [-d] [-v]

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
  $ sf run function -l <value> [-H <value>] [-p <value>] [-s] [-o <value>]

FLAGS
  -H, --headers=<value>...     Set headers.
  -l, --url=<value>            (required) Url of the function to run.
  -o, --connected-org=<value>  Username or alias for the target org; overrides default target org.
  -p, --payload=<value>        Set the payload of the cloudevent. also accepts @file.txt format.
  -s, --structured             Set the cloudevent to be emitted as a structured cloudevent (json).

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
  $ sf run function start [-p <value>] [-d <value>] [--clear-cache] [--no-pull] [-e <value>] [--network <value>] [-v]

FLAGS
  -d, --debug-port=<value>  [default: 9229] Port for remote debugging.
  -e, --env=<value>...      Set environment variables (provided during build and run).
  -p, --port=<value>        [default: 8080] Port for running the function.
  -v, --verbose             Output additional logs.
  --clear-cache             Clear associated cache before executing.
  --network=<value>         Connect and build containers to a network. This can be useful to build containers which
                            require a local resource.
  --no-pull                 Skip pulling builder image before use.

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
