sf-plugin-functions
===================

Functions plugin for the SF CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/sf-plugin-functions.svg)](https://npmjs.org/package/sf-plugin-functions)
[![CircleCI](https://circleci.com/gh/heroku/sf-plugin-functions/tree/master.svg?style=shield)](https://circleci.com/gh/heroku/sf-plugin-functions/tree/master)
[![Codecov](https://codecov.io/gh/heroku/sf-plugin-functions/branch/master/graph/badge.svg)](https://codecov.io/gh/heroku/sf-plugin-functions)
[![Downloads/week](https://img.shields.io/npm/dw/sf-plugin-functions.svg)](https://npmjs.org/package/sf-plugin-functions)
[![License](https://img.shields.io/npm/l/sf-plugin-functions.svg)](https://github.com/heroku/sf-plugin-functions/blob/master/package.json)

# To install and run locally

- `git clone https://github.com/heroku/sf-plugin-functions.git`
- `cd sf-plugin-functions`
- `yarn`
- `sfdx plugins:link`

Now you should be able to run functions commands, e.g. `sfdx env:list`, `sfdx login:functions`

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g sf-plugin-functions
$ sfdx COMMAND
running command...
$ sfdx (-v|--version|version)
sf-plugin-functions/0.0.1 darwin-x64 node-v12.18.4
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`sfdx env:create:compute`](#sfdx-envcreatecompute)
* [`sfdx env:delete`](#sfdx-envdelete)
* [`sfdx env:list`](#sfdx-envlist)
* [`sfdx env:log:tail`](#sfdx-envlogtail)
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

## `sfdx env:create:compute`

create a compute environment for use with Salesforce Functions

```
USAGE
  $ sfdx env:create:compute

OPTIONS
  -a, --setalias=setalias            alias for the created environment
  -o, --connected-org=connected-org  username or alias for the org that the compute environment should be connected to

EXAMPLES
  $ sf env create compute
  $ sf env create compute --setalias my-compute-environment
  $ sf env create compute --connected-org my-scratch-org
```

_See code: [src/commands/env/create/compute.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.0.1/src/commands/env/create/compute.ts)_

## `sfdx env:delete`

delete an environment

```
USAGE
  $ sfdx env:delete

OPTIONS
  -c, --confirm=name             confirmation name
  -e, --environment=environment  (required) environment name or alias

EXAMPLES
  $ sf env delete --environment=billingApp-Scratch1
  $ sf env delete --environment=billingApp-Scratch1 --confirm=billingApp-Scratch1
```

_See code: [src/commands/env/delete.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.0.1/src/commands/env/delete.ts)_

## `sfdx env:list`

List all environments by type

```
USAGE
  $ sfdx env:list

OPTIONS
  -t, --environment-type=org|scratchorg|compute  filter by one or more environment types (org, scratchorg, compute)

  --all                                          show all available envs instead of scoping to active orgs and their
                                                 connected compute envs

EXAMPLES
  $ sf env list
  $ sf env list --all
  $ sf env list --environment-type org --environment-type compute
```

_See code: [src/commands/env/list.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.0.1/src/commands/env/list.ts)_

## `sfdx env:log:tail`

stream log output for an environment

```
USAGE
  $ sfdx env:log:tail

OPTIONS
  -e, --environment=environment  (required) environment name to retrieve logs

EXAMPLE
  sf env log tail --environment=billingApp-Scratch1
```

_See code: [src/commands/env/log/tail.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.0.1/src/commands/env/log/tail.ts)_

## `sfdx env:logdrain:add`

Add log drain to a specified environment

```
USAGE
  $ sfdx env:logdrain:add

OPTIONS
  -e, --environment=environment  (required) environment name, ID, or alias
  -u, --url=url                  (required) endpoint that will receive sent logs

EXAMPLE
  $ sf env logdrain add --environment=billingApp-Sandbox --url=https://example.com/drain
```

_See code: [src/commands/env/logdrain/add.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.0.1/src/commands/env/logdrain/add.ts)_

## `sfdx env:logdrain:list`

List log drains connected to a specified environment

```
USAGE
  $ sfdx env:logdrain:list

OPTIONS
  -e, --environment=environment  (required) environment name, ID, or alias
  --json                         output result in json

EXAMPLE
  $ sf env logdrain list --environment=billingApp-Sandbox
```

_See code: [src/commands/env/logdrain/list.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.0.1/src/commands/env/logdrain/list.ts)_

## `sfdx env:logdrain:remove`

Remove log drain from a specified environment.

```
USAGE
  $ sfdx env:logdrain:remove

OPTIONS
  -e, --environment=environment  (required) environment name, ID, or alias
  -u, --url=url                  (required) logdrain url to remove

EXAMPLE
  $ sf env logdrain remove --environment=billingApp-Sandbox --url=syslog://syslog-a.logdna.com:11137
```

_See code: [src/commands/env/logdrain/remove.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.0.1/src/commands/env/logdrain/remove.ts)_

## `sfdx env:var:get KEY`

display a single config value for an environment

```
USAGE
  $ sfdx env:var:get KEY

OPTIONS
  --environment=environment  (required)

EXAMPLE
  $ sf env var get foo --environment=my-environment
```

_See code: [src/commands/env/var/get.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.0.1/src/commands/env/var/get.ts)_

## `sfdx env:var:list`

list your config vars in a table

```
USAGE
  $ sfdx env:var:list

OPTIONS
  --environment=environment  (required)

EXAMPLE
  $ sf env var list --environment=my-environment
```

_See code: [src/commands/env/var/list.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.0.1/src/commands/env/var/list.ts)_

## `sfdx env:var:set`

sets a single config value for an environment

```
USAGE
  $ sfdx env:var:set

OPTIONS
  --environment=environment  (required)

EXAMPLE
  $ sf env var set foo=bar --environment=my-environment
```

_See code: [src/commands/env/var/set.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.0.1/src/commands/env/var/set.ts)_

## `sfdx env:var:unset`

unset a single config value for an environment

```
USAGE
  $ sfdx env:var:unset

OPTIONS
  --environment=environment  (required)

EXAMPLE
  $ sf env var unset foo --environment=my-environment
```

_See code: [src/commands/env/var/unset.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.0.1/src/commands/env/var/unset.ts)_

## `sfdx generate:function`

create a function with basic scaffolding specific to a given language

```
USAGE
  $ sfdx generate:function

OPTIONS
  -l, --language=(javascript|typescript)  (required) language
  -n, --name=name                         (required) function name

ALIASES
  $ sfdx evergreen:function:init

EXAMPLE
  $ sfdx evergreen:function:create MyFunction --language=javascript
```

_See code: [src/commands/generate/function.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.0.1/src/commands/generate/function.ts)_

## `sfdx generate:project`

```
USAGE
  $ sfdx generate:project

OPTIONS
  -n, --name=name  (required) name of the generated project
```

_See code: [src/commands/generate/project.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.0.1/src/commands/generate/project.ts)_

## `sfdx login:functions`

log into your account

```
USAGE
  $ sfdx login:functions

EXAMPLE
  $ sf login functions
```

_See code: [src/commands/login/functions.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.0.1/src/commands/login/functions.ts)_

## `sfdx project:deploy:functions`

```
USAGE
  $ sfdx project:deploy:functions

OPTIONS
  -b, --branch=branch                deploy the latest commit from a branch different from the currently active branch
  -o, --connected-org=connected-org  (required) deployment org username or alias
  -v, --verbose                      show all deploy output
  --force                            ignore warnings and overwrite remote repository (not allowed in production)
```

_See code: [src/commands/project/deploy/functions.ts](https://github.com/heroku/sf-plugin-functions/blob/v0.0.1/src/commands/project/deploy/functions.ts)_
<!-- commandsstop -->
