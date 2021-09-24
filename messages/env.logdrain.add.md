# summary

Add log drain to a specified environment.

# examples

$ sfdx env:logdrain:add --target-compute=billingApp-Sandbox --drain-url=https://example.com/drain

# flags.drain-url.summary

Endpoint that will receive sent logs.

# flags.environment.deprecation

--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.

# flags.url.deprecation

--url is deprecated and will be removed in a future release. Please use --drain-url going forward.
