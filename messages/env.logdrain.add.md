# summary

Add log drain to a specified environment.

# examples

- Add a log drain:

  <%= config.bin %> <%= command.id %> --target-compute environment-name --url https://path/to/logdrain

# flags.environment.summary

Environment that will send logs.

# flags.url.summary

Endpoint that will receive sent logs.

# flags.environment.deprecation

--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.

# flags.url.deprecation

--url is deprecated and will be removed in a future release. Please use --drain-url going forward.
