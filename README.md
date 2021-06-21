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

- [`sf env:create:compute`](#sf-envcreatecompute)
- [`sf env:delete`](#sf-envdelete)
- [`sf env:display`](#sf-envdisplay)
- [`sf env:list`](#sf-envlist)
- [`sf env:log:tail`](#sf-envlogtail)
- [`sf env:logdrain:add`](#sf-envlogdrainadd)
- [`sf env:logdrain:list`](#sf-envlogdrainlist)
- [`sf env:logdrain:remove`](#sf-envlogdrainremove)
- [`sf env:var:get KEY`](#sf-envvarget-key)
- [`sf env:var:list`](#sf-envvarlist)
- [`sf env:var:set`](#sf-envvarset)
- [`sf env:var:unset`](#sf-envvarunset)
- [`sf generate:function`](#sf-generatefunction)
- [`sf generate:project`](#sf-generateproject)
- [`sf login:functions`](#sf-loginfunctions)
- [`sf project:deploy:functions`](#sf-projectdeployfunctions)
- [`sf run:function`](#sf-runfunction)
- [`sf run:function:start`](#sf-runfunctionstart)

## `sf env:create:compute`

create a compute environment for use with Salesforce Functions

```
USAGE
  $ sf env:create:compute

OPTIONS
  -a, --setalias=setalias            alias for the created environment
  -o, --connected-org=connected-org  username or alias for the org that the compute environment should be connected to

EXAMPLES
  $ sfdx env:create:compute
  $ sfdx env:create:compute --setalias my-compute-environment
  $ sfdx env:create:compute --connected-org my-scratch-org
```

_See code: [src/commands/env/create/compute.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/env/create/compute.ts)_

## `sf env:delete`

delete an environment

```
USAGE
  $ sf env:delete

OPTIONS
  -c, --confirm=name             confirmation name
  -e, --environment=environment  (required) environment name

EXAMPLES
  $ sfdx env:delete --environment=billingApp-Scratch1
  $ sfdx env:delete --environment=billingApp-Scratch1 --confirm=billingApp-Scratch1
```

_See code: [src/commands/env/delete.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/env/delete.ts)_

## `sf env:display`

display details for an environment

```
USAGE
  $ sf env:display

OPTIONS
  -e, --environment=environment  (required) environment name
  --verbose                      verbose display output

EXAMPLE
  $ sfdx env:display --environment=billingApp-Scratch1
```

_See code: [src/commands/env/display.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/env/display.ts)_

## `sf env:list`

List all environments by type

```
USAGE
  $ sf env:list

OPTIONS
  -j, --json                                     output list in JSON format
  -t, --environment-type=org|scratchorg|compute  filter by one or more environment types (org, scratchorg, compute)

  --all                                          show all available envs instead of scoping to active orgs and their
                                                 connected compute envs

EXAMPLES
  $ sfdx env:list
  $ sfdx env:list --all
  $ sfdx env:list --environment-type org --environment-type compute
```

_See code: [src/commands/env/list.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/env/list.ts)_

## `sf env:log:tail`

stream log output for an environment

```
USAGE
  $ sf env:log:tail

OPTIONS
  -e, --environment=environment  (required) environment name to retrieve logs

EXAMPLE
  sfdx env:log:tail --environment=billingApp-Scratch1
```

_See code: [src/commands/env/log/tail.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/env/log/tail.ts)_

## `sf env:logdrain:add`

Add log drain to a specified environment

```
USAGE
  $ sf env:logdrain:add

OPTIONS
  -e, --environment=environment  (required) environment name
  -u, --url=url                  (required) endpoint that will receive sent logs

EXAMPLE
  $ sfdx env:logdrain:add --environment=billingApp-Sandbox --url=https://example.com/drain
```

_See code: [src/commands/env/logdrain/add.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/env/logdrain/add.ts)_

## `sf env:logdrain:list`

List log drains connected to a specified environment

```
USAGE
  $ sf env:logdrain:list

OPTIONS
  -e, --environment=environment  (required) environment name
  --json                         output result in json

EXAMPLE
  $ sfdx env:logdrain:list --environment=billingApp-Sandbox
```

_See code: [src/commands/env/logdrain/list.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/env/logdrain/list.ts)_

## `sf env:logdrain:remove`

Remove log drain from a specified environment.

```
USAGE
  $ sf env:logdrain:remove

OPTIONS
  -e, --environment=environment  (required) environment name
  -u, --url=url                  (required) logdrain url to remove

EXAMPLE
  $ sfdx env:logdrain:remove --environment=billingApp-Sandbox --url=syslog://syslog-a.logdna.com:11137
```

_See code: [src/commands/env/logdrain/remove.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/env/logdrain/remove.ts)_

## `sf env:var:get KEY`

display a single config value for an environment

```
USAGE
  $ sf env:var:get KEY

OPTIONS
  -e, --environment=environment  (required) environment name

EXAMPLE
  $ sfdx env:var:get foo --environment=my-environment
```

_See code: [src/commands/env/var/get.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/env/var/get.ts)_

## `sf env:var:list`

list your config vars in a table

```
USAGE
  $ sf env:var:list

OPTIONS
  -e, --environment=environment  (required) environment name

EXAMPLE
  $ sfdx env:var:list --environment=my-environment
```

_See code: [src/commands/env/var/list.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/env/var/list.ts)_

## `sf env:var:set`

sets a single config value for an environment

```
USAGE
  $ sf env:var:set

OPTIONS
  -e, --environment=environment  (required) environment name

EXAMPLE
  $ sfdx env:var:set foo=bar --environment=my-environment
```

_See code: [src/commands/env/var/set.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/env/var/set.ts)_

## `sf env:var:unset`

unset a single config value for an environment

```
USAGE
  $ sf env:var:unset

OPTIONS
  -e, --environment=environment  (required) environment name

EXAMPLE
  $ sfdx env:var:unset foo --environment=my-environment
```

_See code: [src/commands/env/var/unset.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/env/var/unset.ts)_

## `sf generate:function`

create a function with basic scaffolding specific to a given language

```
USAGE
  $ sf generate:function

OPTIONS
  -l, --language=(javascript|typescript|java)  (required) language
  -n, --name=name                              (required) function name

ALIASES
  $ sf evergreen:function:init

EXAMPLE
  $ sfdx evergreen:function:create MyFunction --language=javascript
```

_See code: [src/commands/generate/function.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/generate/function.ts)_

## `sf generate:project`

```
USAGE
  $ sf generate:project

OPTIONS
  -n, --name=name  (required) name of the generated project
```

_See code: [src/commands/generate/project.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/generate/project.ts)_

## `sf login:functions`

log into your account

```
USAGE
  $ sf login:functions

EXAMPLE
  $ sfdx login:functions
```

_See code: [src/commands/login/functions.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/login/functions.ts)_

## `sf project:deploy:functions`

```
USAGE
  $ sf project:deploy:functions

OPTIONS
  -b, --branch=branch                deploy the latest commit from a branch different from the currently active branch

  -o, --connected-org=connected-org  (required) username or alias for the org that the compute environment should be
                                     connected to

  -q, --quiet                        limit the amount of output displayed from the deploy process

  --force                            ignore warnings and overwrite remote repository (not allowed in production)
```

_See code: [src/commands/project/deploy/functions.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/project/deploy/functions.ts)_

## `sf run:function`

send a cloudevent to a function

```
USAGE
  $ sf run:function

OPTIONS
  -H, --headers=headers              set headers
  -l, --url=url                      (required) url of the function to run
  -o, --connected-org=connected-org  username or alias for the target org; overrides default target org
  -p, --payload=payload              set the payload of the cloudevent. also accepts @file.txt format
  -s, --structured                   set the cloudevent to be emitted as a structured cloudevent (json)

EXAMPLE

       $ sfdx run:function -l http://localhost:8080 -p '{"id": 12345}'
       $ sfdx run:function -l http://localhost:8080 -p '@file.json'
       $ echo '{"id": 12345}' | sfdx run:function -l http://localhost:8080
       $ sfdx run:function -l http://localhost:8080 -p '{"id": 12345}' --structured
```

_See code: [src/commands/run/function.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/run/function.ts)_

## `sf run:function:start`

build and run function image locally

```
USAGE
  $ sf run:function:start

OPTIONS
  -d, --debug-port=debug-port  [default: 9229] port for remote debugging
  -e, --env=env                set environment variables (provided during build and run)
  -p, --port=port              [default: 8080] port for running the function
  -v, --verbose                output additional logs
  --clear-cache                clear associated cache before executing.

  --network=network            Connect and build containers to a network. This can be useful to build containers which
                               require a local resource.

  --no-pull                    skip pulling builder image before use

EXAMPLE

       $ sfdx run:function:start
       $ sfdx run:function:start -e VAR=VALUE
       $ sfdx run:function:start --network host --no-pull --clear-cache --debug-port 9000 --port 5000
```

_See code: [src/commands/run/function/start.ts](https://github.com/salesforcecli/plugin-functions/blob/v0.2.3/src/commands/run/function/start.ts)_

<!-- commandsstop -->
