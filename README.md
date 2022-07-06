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
- [`sf env compute collaborator add`](#sf-env-compute-collaborator-add)
- [`sf env create compute`](#sf-env-create-compute)
- [`sf env delete`](#sf-env-delete)
- [`sf env log`](#sf-env-log)
- [`sf env log tail`](#sf-env-log-tail)
- [`sf env logdrain add`](#sf-env-logdrain-add)
- [`sf env logdrain list`](#sf-env-logdrain-list)
- [`sf env logdrain remove`](#sf-env-logdrain-remove)
- [`sf env var get KEY`](#sf-env-var-get-key)
- [`sf env var list`](#sf-env-var-list)
- [`sf env var set`](#sf-env-var-set)
- [`sf env var unset`](#sf-env-var-unset)
- [`sf generate function`](#sf-generate-function)
- [`sf login functions`](#sf-login-functions)
- [`sf login functions jwt`](#sf-login-functions-jwt)
- [`sf logout functions`](#sf-logout-functions)
- [`sf run function`](#sf-run-function)
- [`sf run function start`](#sf-run-function-start)
- [`sf run function start container`](#sf-run-function-start-container)
- [`sf run function start local`](#sf-run-function-start-local)
- [`sf whoami functions`](#sf-whoami-functions)

## `sf deploy functions`

Deploy a Salesforce Function to an org from your local project.

```
USAGE
  $ sf deploy functions -o <value> [-b <value>] [--force] [-q] [-j]

FLAGS
  -b, --branch=<value>         Deploy the latest commit from a branch different from the currently active branch.
  -j, --json                   Output list in JSON format.
  -o, --connected-org=<value>  (required) Username or alias for the org that the compute environment should be connected
                               to.
  -q, --quiet                  Limit the amount of output displayed from the deploy process.
  --force                      Ignore warnings and overwrite remote repository (not allowed in production).

DESCRIPTION
  Deploy a Salesforce Function to an org from your local project.

  You must run this command from within a git repository. Only committed changes to Functions are deployed. The active
  branch is deployed unless specified otherwise with `--branch`.

EXAMPLES
  Deploy a Salesforce Function:

    $ sf deploy functions --connected-org org-alias

  Deploy to 'deploy-branch':

    $ sf deploy functions --connected-org org-alias --branch deploy-branch

  Overwrite the remote repository:

    $ sf deploy functions --connected-org org-alias --force
```

## `sf env compute collaborator add`

Add a Heroku user as a collaborator on this Functions account, allowing them to attach Heroku add-ons to compute environments.

```
USAGE
  $ sf env compute collaborator add -h <value>

FLAGS
  -h, --heroku-user=<value>  (required) Email address of the Heroku user you're adding as a collaborator.

EXAMPLES
  Add a Heroku user as a collaborator on this Functions account.

    $ sf env compute collaborator add --heroku-user example@heroku.com
```

## `sf env create compute`

Create a compute environment for use with Salesforce Functions.

```
USAGE
  $ sf env create compute [-o <value>] [-a <value>] [-j]

FLAGS
  -a, --alias=<value>          Alias for the created environment.
  -j, --json                   Output list in JSON format.
  -o, --connected-org=<value>  Username or alias for the org that the compute environment should be connected to.

DESCRIPTION
  Create a compute environment for use with Salesforce Functions.

  Compute environments must be connected to a Salesforce org. By default the command uses your local environment's
  connected org. Use the '--connected-org' flag to specify a specific org. Run 'sf env list' to see a list of
  environments.

EXAMPLES
  Create a compute environment to run Salesforce Functions:

    $ sf env create compute

  Connect the environment to a specific org:

    $ sf env create compute --connected-org=org-alias

  Create an alias for the compute environment:

    $ sf env create compute --alias environment-alias
```

## `sf env delete`

Delete an environment.

```
USAGE
  $ sf env delete [-e <value> | ] [--confirm <value>] [-j]

FLAGS
  -e, --target-compute=<value>  Environment name.
  -j, --json                    Output list in JSON format.
  --confirm=name...             Confirmation name.

DESCRIPTION
  Delete an environment.

  You must include the name of the environment to delete using '--target-compute'. Run 'sf env list' to see a list of
  environments.

  Running this command will prompt a confirmation. If you want to skip this confirmation, use the '--confirm' flag and
  the environment alias to skip confirmation.

EXAMPLES
  Delete a compute environment:

    $ sf env delete --target-compute environment-alias

  Delete without a confirmation step:

    $ sf env delete --target-compute environment-alias --confirm environment-alias
```

## `sf env log`

Stream log output for an environment.

```
USAGE
  $ sf env log [-e <value> | ] [-n <value>]

FLAGS
  -e, --target-compute=<value>  Compute environment name to retrieve logs.
  -n, --num=<value>             Number of lines to display.

EXAMPLES
  Stream log output:

    $ sf env log --target-compute environment-alias
```

## `sf env log tail`

Stream log output for an environment.

```
USAGE
  $ sf env log tail [-e <value> | ]

FLAGS
  -e, --target-compute=<value>  Compute environment name to retrieve logs.

EXAMPLES
  Stream log output:

    $ sf env log tail --target-compute environment-alias
```

## `sf env logdrain add`

Add log drain to a specified environment.

```
USAGE
  $ sf env logdrain add [-e <value> | ] [-l <value> | ] [-j]

FLAGS
  -e, --target-compute=<value>  Environment name.
  -j, --json                    Output list in JSON format.
  -l, --drain-url=<value>       Endpoint that will receive sent logs.

DESCRIPTION
  Add log drain to a specified environment.

  Both '--target-compute' and '--url' are required flags. '--url' should be a HTTP or HTTPS URL that can receive the log
  drain messages.

EXAMPLES
  Add a log drain:

    $ sf env logdrain add --target-compute environment-name --url https://path/to/logdrain
```

## `sf env logdrain list`

List log drains connected to a specified environment.

```
USAGE
  $ sf env logdrain list [-e <value> | ] [-j]

FLAGS
  -e, --target-compute=<value>  Environment name.
  -j, --json                    Output list in JSON format.

EXAMPLES
  List log drains:

    $ sf env logdrain list --target-compute environment-alias

  List log drains as json:

    $ sf env logdrain list --target-compute environment-alias --json
```

## `sf env logdrain remove`

Remove log drain from a specified environment.

```
USAGE
  $ sf env logdrain remove [-e <value> | ] [-l <value> | ] [-j]

FLAGS
  -e, --target-compute=<value>  Environment name.
  -j, --json                    Output list in JSON format.
  -l, --drain-url=<value>       Log drain url to remove.

DESCRIPTION
  Remove log drain from a specified environment.

  Both '--target-compute' and '--drain-url' are required flags.

EXAMPLES
  Remove a logdrain:

    $ sf env logdrain remove --target-compute environment-alias --url https://path/to/logdrain
```

## `sf env var get KEY`

Display a single config variable for an environment.

```
USAGE
  $ sf env var get [KEY] [-e <value> | ] [-j]

FLAGS
  -e, --target-compute=<value>  Environment name.
  -j, --json                    Output list in JSON format.

DESCRIPTION
  Display a single config variable for an environment.

  You must provide the '--target-compute' flag and the key to retrieve.

EXAMPLES
  Get a config variable:

    $ sf env var get [KEY] --target-compute environment-alias
```

## `sf env var list`

List your environment's config vars in a table.

```
USAGE
  $ sf env var list [-e <value> | ] [-j]

FLAGS
  -e, --target-compute=<value>  Environment name.
  -j, --json                    Output list in JSON format.

DESCRIPTION
  List your environment's config vars in a table.

  Use the '--json' flag to return config vars in JSON format.

EXAMPLES
  List config vars:

    $ sf env var list --target-compute environment-alias

  List in JSON format:

    $ sf env var list --target-compute environment-alias --json
```

## `sf env var set`

Set a single config value for an environment.

```
USAGE
  $ sf env var set [-e <value> | ] [-j]

FLAGS
  -e, --target-compute=<value>  Environment name.
  -j, --json                    Output list in JSON format.

EXAMPLES
  Set a config value:

    $ sf env var set [KEY]=[VALUE] --target-compute environment-alias
```

## `sf env var unset`

Unset a single config value for an environment.

```
USAGE
  $ sf env var unset [-e <value> | ] [-j]

FLAGS
  -e, --target-compute=<value>  Environment name.
  -j, --json                    Output list in JSON format.

DESCRIPTION
  Unset a single config value for an environment.

  Run 'sf env var list' to see a list of config values that can be unset.

EXAMPLES
  Unset a value:

    $ sf env var unset --target-compute environment-alias
```

## `sf generate function`

Create a Salesforce Function with basic scaffolding specific to a given language.

```
USAGE
  $ sf generate function -l javascript|typescript|java [-n <value> | ]

FLAGS
  -l, --language=(javascript|typescript|java)  (required) Language. Can be one of: javascript, typescript, java.
  -n, --function-name=<value>                  Function name. Must start with a capital letter.

DESCRIPTION
  Create a Salesforce Function with basic scaffolding specific to a given language.

  Both '--language' and '--name' are required flags. Function names must start with a capital letter.

EXAMPLES
  Create a JavaScript function:

    $ sf generate function --function-name myfunction --language javascript
```

## `sf login functions`

Log in to Salesforce Functions.

```
USAGE
  $ sf login functions

DESCRIPTION
  Log in to Salesforce Functions.

  This step is required to develop or deploy Salesforce Functions.

EXAMPLES
  Log in to Salesforce Functions:

    $ sf login functions
```

## `sf login functions jwt`

Login using JWT instead of default web-based flow. This will authenticate you with both sf and Salesforce Functions.

```
USAGE
  $ sf login functions jwt -u <value> -f <value> -i <value> [-l <value> | ] [-j] [-a <value>] [-d] [-v]

FLAGS
  -a, --alias=<value>         Alias for the org.
  -d, --set-default           Set the org as the default that all org-related commands run against.
  -f, --keyfile=<value>       (required) Path to JWT keyfile.
  -i, --clientid=<value>      (required) OAuth client ID.
  -j, --json                  Output list in JSON format.
  -l, --instance-url=<value>  The login URL of the instance the org lives on.
  -u, --username=<value>      (required) Authentication username.
  -v, --set-default-dev-hub   Set the org as the default Dev Hub for scratch org creation.

DESCRIPTION
  Login using JWT instead of default web-based flow. This will authenticate you with both sf and Salesforce Functions.

  Use this command when executing from a script.

EXAMPLES
  Log in using JWT:

    $ sf login functions jwt --username example@username.org --keyfile file.key --clientid 123456

  Log in and specify the org alias and URL, set as default org and default Dev Hub, and format output as JSON:

    $ sf login functions jwt --username example@username.org --keyfile file.key --clientid 123456 --alias org-alias \
      --set-default --set-default-dev-hub --instance-url https://path/to/instance --json
```

## `sf logout functions`

Log out of your Salesforce Functions account.

```
USAGE
  $ sf logout functions [-j]

FLAGS
  -j, --json  Output list in JSON format.

EXAMPLES
  Log out:

    $ sf logout functions
```

## `sf run function`

Send a cloudevent to a function.

```
USAGE
  $ sf run function [-l <value> | ] [-H <value>] [-p <value>] [-s] [-o <value>] [-j]

FLAGS
  -H, --headers=<value>...     Set headers.
  -j, --json                   Output list in JSON format.
  -l, --function-url=<value>   URL of the function to run.
  -o, --connected-org=<value>  Username or alias for the target org; overrides default target org.
  -p, --payload=<value>        Set the payload of the cloudevent as a JSON object or a path to a file via @file.json.
  -s, --structured             Set the cloudevent to be emitted as a structured JSON cloudevent.

EXAMPLES
  Run a function:

    $ sf run function --url http://path/to/function

  Run a function with a payload and a JSON response:

    $ sf run function --url http://path/to/function --payload '@file.json' --structured
```

## `sf run function start`

Build and run a Salesforce Function.

```
USAGE
  $ sf run function start [-b <value>] [-l javascript|typescript|java|auto] [-p <value>] [-v]

FLAGS
  -b, --debug-port=<value>                          [default: 9229] Port for remote debugging.
  -l, --language=(javascript|typescript|java|auto)  [default: auto] The language that the function runs in.
  -p, --port=<value>                                [default: 8080] Port for running the function.
  -v, --verbose                                     Output additional logs.

DESCRIPTION
  Build and run a Salesforce Function.

  Run this command from the directory of your Salesforce Functions project.

  This command will run the target function locally (on the same operating system as this CLI), just like the `local`
  subcommand.

  Previously, this command ran functions in a container. Container mode is still supported via the `container`
  subcommand. Arguments relevant to container mode are still accepted, but are deprecated, ignored, and will be dropped
  in a future release.

EXAMPLES
  Build a function and start the invoker

    $ sf run function start

  Start the invoker with a specific language and port

    $ sf run function start --port 5000 --language javascript
```

## `sf run function start container`

Build and run a Salesforce Function in a container.

```
USAGE
  $ sf run function start container [-p <value>] [-b <value>] [--clear-cache] [--no-pull] [-e <value>] [--network
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

DESCRIPTION
  Build and run a Salesforce Function in a container.

  Run this command from the directory of your Salesforce Functions project.

EXAMPLES
  Build and run a function:

    $ sf run function start container

  Run a function on a specific port with additional logs:

    $ sf run function start container --port 5000 --verbose

  Add environment variables and specify a network:

    $ sf run function start container --env KEY=VALUE --network host
```

## `sf run function start local`

Build and run a Salesforce Function locally.

```
USAGE
  $ sf run function start local [-p <value>] [-b <value>] [-l javascript|typescript|java|auto]

FLAGS
  -b, --debug-port=<value>                          [default: 9229] Port to use for debbugging the function.
  -l, --language=(javascript|typescript|java|auto)  [default: auto] The language that the function runs in.
  -p, --port=<value>                                [default: 8080] Port to bind the invoker to.

DESCRIPTION
  Build and run a Salesforce Function locally.

EXAMPLES
  Build a function and start the invoker

    $ sf run function start local

  Start the invoker with a specific language and port

    $ sf run function start local --port 5000 --language javascript
```

## `sf whoami functions`

Show information on your Salesforce Functions login.

```
USAGE
  $ sf whoami functions [-j]

FLAGS
  -j, --json  Output list in JSON format.

DESCRIPTION
  Show information on your Salesforce Functions login.

  Returns your email and ID. Use '--show-token' to show your Salesforce Functions token.

EXAMPLES
  Get account information:

    $ sf whoami functions

  Show token and output result as JSON:

    $ sf whoami functions --show-token --json
```

<!-- commandsstop -->
