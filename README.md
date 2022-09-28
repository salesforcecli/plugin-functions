# plugin-functions <!-- omit in toc -->

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![NPM](https://img.shields.io/npm/v/@salesforce/plugin-functions.svg?label=@salesforce/functions)](https://www.npmjs.com/package/@salesforce/plugin-functions) [![CircleCI](https://circleci.com/gh/salesforcecli/plugin-functions/tree/main.svg?style=shield)](https://circleci.com/gh/salesforcecli/plugin-functions/tree/main) [![Downloads/week](https://img.shields.io/npm/dw/@salesforce/plugin-functions.svg)](https://npmjs.org/package/@salesforce/plugin-functions) [![License](https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg)](https://raw.githubusercontent.com/salesforcecli/plugin-functions/main/LICENSE.txt)

Functions plugin for the SF CLI

<!-- toc -->

- [plugin-functions <!-- omit in toc -->](#plugin-functions----omit-in-toc---)
- [Usage](#usage)
- [Contributing](#contributing)
- [Build](#build)
- [Clone the repository](#clone-the-repository)
- [Navigate to the project folder](#navigate-to-the-project-folder)
- [Install the dependencies and compile](#install-the-dependencies-and-compile)
- [Run using local run file.](#run-using-local-run-file)
- [Update README.md](#update-readmemd)
- [Releases](#releases)
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

# Contributing

1. Please read our [Code of Conduct](CODE_OF_CONDUCT.md)
2. Create a new issue before starting your project so that we can keep track of
   what you are trying to add/fix. That way, we can also offer suggestions or
   let you know if there is already an effort in progress.
3. Fork this repository.
4. [Build the plugin locally](#build)
5. Create a _topic_ branch in your fork. Note, this step is recommended but technically not required if contributing using a fork.
6. Edit the code in your fork.
7. Create commit messages that adhere to the [conventional commits specification](https://www.conventionalcommits.org/en/v1.0.0/).
8. Write appropriate tests for your changes. Try to achieve at least 95% code coverage on any new code. No pull request will be accepted without unit tests.
9. Sign CLA (see [CLA](#cla) below).
10. Send us a pull request when you are done. We'll review your code, suggest any needed changes, and merge it in.

## CLA <!-- omit in toc -->

External contributors will be required to sign a Contributor's License
Agreement. You can do so by going to https://cla.salesforce.com/sign-cla.

# Build

To build the plugin locally, make sure to have yarn installed and run the following commands:

```bash
# Clone the repository
git clone git@github.com:salesforcecli/plugin-functions

# Navigate to the project folder
cd plugin-functions

# Install the dependencies and compile
yarn install
yarn build
```

To use your plugin, run using the local `./bin/run` or `./bin/run.cmd` file.

```bash
# Run using local run file.
./bin/run env list
```

# Update README.md

To manually regenerate commands in the README.md file after adding or updating run `npx oclif readme`

# Releases

The following steps are automated for package releases

## Version Bump

We use [standard-version](https://github.com/conventional-changelog/standard-version) to determine the next version that will be published. This means that all commits **must** adhere to the [conventional commits specification](https://www.conventionalcommits.org/en/v1.0.0/) in order for `standard-version` to work.

In the case that you have manually bumped the version in the package.json, then the plugin will respect that and publish that version instead of using `standard-version` to determine the next version.

NOTE: We consider the `chore`, `style`, `docs`, `ci`, `test` commit types to be "non-releasable", meaning that if all the commits are of those types then we do not publish a new version. However, if you've manually bumped the version in the package.json then the plugin will publish that version regardless of the commit types.

### `--prerelease` <!-- omit in toc -->

1. If you've manually bumped the version in the package.json, the prerelease tag will not be added if it's not already there. For example, if you want to do a prerelease for a new major version, you will want to update the package version to `X.0.0-<your-prerelease-tag>`.

2. When using the `--prerelease` flag, `standard-version` will bump both the prerelease version and the package version, e.g. `3.0.0-alpha.0` => `3.0.1-alpha.1`. See https://github.com/conventional-changelog/standard-version#release-as-a-pre-release for more

## Changelogs

`standard-version` automatically handles this for us as well. Again you must adhere to the [conventional commits specification](https://www.conventionalcommits.org/en/v1.0.0/) in order for the changelog generation to work.

## Build

After determining the next version, the plugin builds the package using `yarn build`. This means that you must have a `build` script included in the package.json

## Signing

If you pass the `--sign (-s)` flag into the release command, then the plugin will sign the package and verify that the signature exists in S3.

## Publishing

Once the package has been built and signed it will be published to npm. The command will not exit until the new version is found on the npm registry.

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
  $ sf deploy functions -o <value> [--json] [-b <value>] [--force] [-q]

FLAGS
  -b, --branch=<value>         Deploy the latest commit from a branch different from the currently active branch.
  -o, --connected-org=<value>  (required) Username or alias for the org that the compute environment should be connected
                               to.
  -q, --quiet                  Limit the amount of output displayed from the deploy process.
  --force                      Ignore warnings and overwrite remote repository (not allowed in production).

GLOBAL FLAGS
  --json  Format output as json.

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
  $ sf env create compute [--json] [-o <value>] [-a <value>]

FLAGS
  -a, --alias=<value>          Alias for the created environment.
  -o, --connected-org=<value>  Username or alias for the org that the compute environment should be connected to.

GLOBAL FLAGS
  --json  Format output as json.

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
  $ sf env delete [--json] [-e <value> | ] [--confirm <value>]

FLAGS
  -e, --target-compute=<value>  Environment name.
  --confirm=name...             Confirmation name.

GLOBAL FLAGS
  --json  Format output as json.

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
  $ sf env logdrain add [--json] [-e <value> | ] [-l <value> | ]

FLAGS
  -e, --target-compute=<value>  Environment name.
  -l, --drain-url=<value>       Endpoint that will receive sent logs.

GLOBAL FLAGS
  --json  Format output as json.

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
  $ sf env logdrain list [--json] [-e <value> | ]

FLAGS
  -e, --target-compute=<value>  Environment name.

GLOBAL FLAGS
  --json  Format output as json.

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
  $ sf env logdrain remove [--json] [-e <value> | ] [-l <value> | ]

FLAGS
  -e, --target-compute=<value>  Environment name.
  -l, --drain-url=<value>       Log drain url to remove.

GLOBAL FLAGS
  --json  Format output as json.

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
  $ sf env var get [KEY] [--json] [-e <value> | ]

FLAGS
  -e, --target-compute=<value>  Environment name.

GLOBAL FLAGS
  --json  Format output as json.

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
  $ sf env var list [--json] [-e <value> | ]

FLAGS
  -e, --target-compute=<value>  Environment name.

GLOBAL FLAGS
  --json  Format output as json.

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
  $ sf env var set [--json] [-e <value> | ]

FLAGS
  -e, --target-compute=<value>  Environment name.

GLOBAL FLAGS
  --json  Format output as json.

EXAMPLES
  Set a config value:

    $ sf env var set [KEY]=[VALUE] --target-compute environment-alias
```

## `sf env var unset`

Unset a single config value for an environment.

```
USAGE
  $ sf env var unset [--json] [-e <value> | ]

FLAGS
  -e, --target-compute=<value>  Environment name.

GLOBAL FLAGS
  --json  Format output as json.

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
  $ sf login functions jwt -u <value> -f <value> -i <value> [--json] [-l <value> | ] [-a <value>] [-d] [-v]

FLAGS
  -a, --alias=<value>         Alias for the org.
  -d, --set-default           Set the org as the default that all org-related commands run against.
  -f, --keyfile=<value>       (required) Path to JWT keyfile.
  -i, --clientid=<value>      (required) OAuth client ID.
  -l, --instance-url=<value>  The login URL of the instance the org lives on.
  -u, --username=<value>      (required) Authentication username.
  -v, --set-default-dev-hub   Set the org as the default Dev Hub for scratch org creation.

GLOBAL FLAGS
  --json  Format output as json.

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
  $ sf logout functions [--json]

GLOBAL FLAGS
  --json  Format output as json.

EXAMPLES
  Log out:

    $ sf logout functions
```

## `sf run function`

Send a cloudevent to a function.

```
USAGE
  $ sf run function [--json] [-l <value> | ] [-H <value>] [-p <value>] [-s] [-o <value>]

FLAGS
  -H, --headers=<value>...     Set headers.
  -l, --function-url=<value>   URL of the function to run.
  -o, --connected-org=<value>  Username or alias for the target org; overrides default target org.
  -p, --payload=<value>        Set the payload of the cloudevent as a JSON object or a path to a file via @file.json.
  -s, --structured             Set the cloudevent to be emitted as a structured JSON cloudevent.

GLOBAL FLAGS
  --json  Format output as json.

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
  $ sf whoami functions [--json]

GLOBAL FLAGS
  --json  Format output as json.

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
