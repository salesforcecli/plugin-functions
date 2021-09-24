# summary

Remove log drain from a specified environment.

# examples

$ sfdx env:logdrain:remove --target-compute=billingApp-Sandbox --drain-url=syslog://syslog-a.logdna.com:11137

# flags.drain-url.summary

Logdrain url to remove.

# flags.environment.deprecation

--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.

# flags.url.deprecation

--url is deprecated and will be removed in a future release. Please use --drain-url going forward.
