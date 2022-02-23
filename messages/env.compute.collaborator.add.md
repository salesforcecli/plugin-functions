# summary

Add log drain to a specified environment.

# description

Both '--target-compute' and '--url' are required flags. '--url' should be a HTTP or HTTPS URL that can receive the log drain messages.

# examples

- Add a log drain:

  <%= config.bin %> <%= command.id %> --target-compute environment-name --url https://path/to/logdrain

# flags.target-compute.summary

Compute environment that will send logs.

# flags.drain-url.summary

Endpoint that will receive sent logs.

# flags.environment.deprecation

--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.

# flags.url.deprecation

--url is deprecated and will be removed in a future release. Please use --drain-url going forward.
