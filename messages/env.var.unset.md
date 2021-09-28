# summary

Unset a single config value for an environment.

# description

Run 'sf env var list' to see a list of config values that can be unset.

# examples

- Unset a value:

  <%= config.bin %> <%= command.id %> --target-compute environment-alias

# flags.environment.summary

Environment in which to unset the config value.

# flags.environment.deprecation

--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.
