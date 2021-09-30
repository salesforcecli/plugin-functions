# summary

Delete an environment.

# description

You must include the name of the environment to delete using '--target-compute'. Run 'sf env list' to see a list of environments.

Running this command will prompt a confirmation. If you want to skip this confirmation, use the '--confirm' flag and the environment alias to skip confirmation.

# examples

- Delete a compute environment:

  <%= config.bin %> <%= command.id %> --target-compute environment-alias

- Delete without a confirmation step:

  <%= config.bin %> <%= command.id %> --target-compute environment-alias --confirm environment-alias

# flags.target-compute.summary

The alias of the environment to delete.

# flags.confirm.summary

Confirm deletion using the alias of the environment to delete.

# flags.environment.deprecation

--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.
