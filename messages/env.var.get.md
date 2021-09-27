# summary

Display a single config variable for an environment.

# description

You must provide the '--target-compute' flag and the key to retrieve.

# examples

- Get a config variable:

  <%= config.bin %> <%= command.id %> [KEY] --target-compute environment-alias

# flags.environment.summary

Environment to retrieve variables from.

# flags.environment.deprecation

--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.
