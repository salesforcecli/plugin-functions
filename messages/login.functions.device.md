# summary

Login using device flow instead of default web-based flow. This will authenticate you with both sf and Salesforce Functions.

# description

Use this command when executing from a script.

# examples

- Log in using device flow:

  <%= config.bin %> <%= command.id %>

- Log in and specify the org alias and URL, set as default org and default Dev Hub, and format output as JSON:

  <%= config.bin %> <%= command.id %> --alias org-alias --set-default --set-default-dev-hub --instance-url https://path/to/instance --json

# flags.instance-url.summary

The login URL of the instance the org lives on.

# flags.json.summary

Format output as JSON.

# flags.alias.summary

Alias for the org.

# flags.set-default.summary

Set the org as the default that all org-related commands run against.

# flags.set-default-dev-hub.summary

Set the org as the default Dev Hub for scratch org creation.

# flags.instanceurl.deprecation

--instanceurl is deprecated and will be removed in a future release. Please use --instance-url going forward.
