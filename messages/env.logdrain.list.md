# summary

List log drains connected to a specified environment.

# description

# examples

- List log drains:

  <%= config.bin %> <%= command.id %> --target-compute environment-alias

- List log drains as json:

  <%= config.bin %> <%= command.id %> --target-compute environment-alias --json

# flags.target-compute.summary

Compute environment that contains log drains.

# flags.environment.deprecation

--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.
