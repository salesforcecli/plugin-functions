sf-plugin-functions
===================

Functions plugin for the SF CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/sf-plugin-functions.svg)](https://npmjs.org/package/sf-plugin-functions)
[![CircleCI](https://circleci.com/gh/heroku/sf-plugin-functions/tree/master.svg?style=shield)](https://circleci.com/gh/heroku/sf-plugin-functions/tree/master)
[![Downloads/week](https://img.shields.io/npm/dw/sf-plugin-functions.svg)](https://npmjs.org/package/sf-plugin-functions)
[![License](https://img.shields.io/npm/l/sf-plugin-functions.svg)](https://github.com/heroku/sf-plugin-functions/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
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
* [`sfdx env:create:compute`](#sfdx-envcreatecompute)
* [`sfdx env:delete`](#sfdx-envdelete)
* [`sfdx env:display`](#sfdx-envdisplay)
* [`sfdx env:list`](#sfdx-envlist)
* [`sfdx env:logdrain:add`](#sfdx-envlogdrainadd)
* [`sfdx env:logdrain:list`](#sfdx-envlogdrainlist)
* [`sfdx env:logdrain:remove`](#sfdx-envlogdrainremove)
* [`sfdx env:var:get KEY`](#sfdx-envvarget-key)
* [`sfdx env:var:list`](#sfdx-envvarlist)
* [`sfdx env:var:set`](#sfdx-envvarset)
* [`sfdx env:var:unset`](#sfdx-envvarunset)
* [`sfdx generate:function`](#sfdx-generatefunction)
* [`sfdx generate:project`](#sfdx-generateproject)
* [`sfdx login:functions`](#sfdx-loginfunctions)
* [`sfdx project:deploy:functions`](#sfdx-projectdeployfunctions)
* [`sfdx run:function`](#sfdx-runfunction)
* [`sfdx run:function:start`](#sfdx-runfunctionstart)

## `sfdx env:create:compute`

create a compute environment for use with Salesforce Functions

```
USAGE
  $ sfdx env:create:compute

OPTIONS
  -a, --setalias=setalias            alias for the created environment
  -o, --connected-org=connected-org  username or alias for the org that the compute environment should be connected to

EXAMPLES
  $ sfdx env:create:compute
  $ sfdx env:create:compute --setalias my-compute-environment
  $ sfdx env:create:compute --connected-org my-scratch-org
```

_See code: [src/commands/env/create/compute.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/env/create/compute.ts)_

## `sfdx env:delete`

delete an environment

```
USAGE
  $ sfdx env:delete

OPTIONS
  -c, --confirm=name             confirmation name
  -e, --environment=environment  (required) environment name

EXAMPLES
  $ sfdx env:delete --environment=billingApp-Scratch1
  $ sfdx env:delete --environment=billingApp-Scratch1 --confirm=billingApp-Scratch1
```

_See code: [src/commands/env/delete.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/env/delete.ts)_

## `sfdx env:display`

display details for an environment

```
USAGE
  $ sfdx env:display

OPTIONS
  -e, --environment=environment  (required) environment name
  --verbose                      verbose display output

EXAMPLE
  $ sfdx env:display --environment=billingApp-Scratch1
```

_See code: [src/commands/env/display.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/env/display.ts)_

## `sfdx env:list`

List all environments by type

```
USAGE
  $ sfdx env:list

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

_See code: [src/commands/env/list.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/env/list.ts)_

## `sfdx env:logdrain:add`

Add log drain to a specified environment

```
USAGE
  $ sfdx env:logdrain:add

OPTIONS
  -e, --environment=environment  (required) environment name
  -u, --url=url                  (required) endpoint that will receive sent logs

EXAMPLE
  $ sfdx env:logdrain:add --environment=billingApp-Sandbox --url=https://example.com/drain
```

_See code: [src/commands/env/logdrain/add.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/env/logdrain/add.ts)_

## `sfdx env:logdrain:list`

List log drains connected to a specified environment

```
USAGE
  $ sfdx env:logdrain:list

OPTIONS
  -e, --environment=environment  (required) environment name
  --json                         output result in json

EXAMPLE
  $ sfdx env:logdrain:list --environment=billingApp-Sandbox
```

_See code: [src/commands/env/logdrain/list.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/env/logdrain/list.ts)_

## `sfdx env:logdrain:remove`

Remove log drain from a specified environment.

```
USAGE
  $ sfdx env:logdrain:remove

OPTIONS
  -e, --environment=environment  (required) environment name
  -u, --url=url                  (required) logdrain url to remove

EXAMPLE
  $ sfdx env:logdrain:remove --environment=billingApp-Sandbox --url=syslog://syslog-a.logdna.com:11137
```

_See code: [src/commands/env/logdrain/remove.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/env/logdrain/remove.ts)_

## `sfdx env:var:get KEY`

display a single config value for an environment

```
USAGE
  $ sfdx env:var:get KEY

OPTIONS
  -e, --environment=environment  (required) environment name

EXAMPLE
  $ sfdx env:var:get foo --environment=my-environment
```

_See code: [src/commands/env/var/get.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/env/var/get.ts)_

## `sfdx env:var:list`

list your config vars in a table

```
USAGE
  $ sfdx env:var:list

OPTIONS
  -e, --environment=environment  (required) environment name

EXAMPLE
  $ sfdx env:var:list --environment=my-environment
```

_See code: [src/commands/env/var/list.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/env/var/list.ts)_

## `sfdx env:var:set`

sets a single config value for an environment

```
USAGE
  $ sfdx env:var:set

OPTIONS
  -e, --environment=environment  (required) environment name

EXAMPLE
  $ sfdx env:var:set foo=bar --environment=my-environment
```

_See code: [src/commands/env/var/set.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/env/var/set.ts)_

## `sfdx env:var:unset`

unset a single config value for an environment

```
USAGE
  $ sfdx env:var:unset

OPTIONS
  -e, --environment=environment  (required) environment name

EXAMPLE
  $ sfdx env:var:unset foo --environment=my-environment
```

_See code: [src/commands/env/var/unset.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/env/var/unset.ts)_

## `sfdx generate:function`

create a function with basic scaffolding specific to a given language

```
USAGE
  $ sfdx generate:function

OPTIONS
  -l, --language=(javascript|typescript|java)  (required) language
  -n, --name=name                              (required) function name

ALIASES
  $ sfdx evergreen:function:init

EXAMPLE
  $ sfdx evergreen:function:create MyFunction --language=javascript
```

_See code: [src/commands/generate/function.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/generate/function.ts)_

## `sfdx generate:project`

```
USAGE
  $ sfdx generate:project

OPTIONS
  -n, --name=name  (required) name of the generated project
```

_See code: [src/commands/generate/project.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/generate/project.ts)_

## `sfdx login:functions`

log into your account

```
USAGE
  $ sfdx login:functions

EXAMPLE
  $ sfdx login:functions
```

_See code: [src/commands/login/functions.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/login/functions.ts)_

## `sfdx project:deploy:functions`

```
USAGE
  $ sfdx project:deploy:functions

OPTIONS
  -b, --branch=branch                deploy the latest commit from a branch different from the currently active branch

  -o, --connected-org=connected-org  (required) username or alias for the org that the compute environment should be
                                     connected to

  -q, --quiet                        limit the amount of output displayed from the deploy process

  --force                            ignore warnings and overwrite remote repository (not allowed in production)
```

_See code: [src/commands/project/deploy/functions.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/project/deploy/functions.ts)_

## `sfdx run:function`

send a cloudevent to a function

```
USAGE
  $ sfdx run:function

OPTIONS
  -H, --headers=headers                set headers
  -p, --payload=payload                set the payload of the cloudevent. also accepts @file.txt format
  -t, --targetusername=targetusername  username or alias for the target org; overrides default target org
  -u, --url=url                        (required) url of the function to run
  --structured                         set the cloudevent to be emitted as a structured cloudevent (json)

EXAMPLE

       $ sfdx run:function -u http://localhost:8080 -p '{"id": 12345}'
       $ sfdx run:function -u http://localhost:8080 -p '@file.json'
       $ echo '{"id": 12345}' | sfdx run:function -u http://localhost:8080
       $ sfdx run:function -u http://localhost:8080 -p '{"id": 12345}' --structured
```

_See code: [src/commands/run/function.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/run/function.ts)_

## `sfdx run:function:start`

build and run function image locally

```
USAGE
  $ sfdx run:function:start

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

_See code: [src/commands/run/function/start.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.1.2/src/commands/run/function/start.ts)_
<!-- commandsstop -->
