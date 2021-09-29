# summary

Remove log drain from a specified environment.

# description

Both '--target-compute' and '--drain-url' are required flags.

# examples

- Remove a logdrain:

  <%= config.bin %> <%= command.id %> --target-compute environment-alias --url https://path/to/logdrain

# flags.target-compute.summary

Compute environment that contains log drains.

# flags.drain-url.summary

Log drain url to remove.

# flags.environment.deprecation

--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.

# flags.url.deprecation

--url is deprecated and will be removed in a future release. Please use --drain-url going forward.
