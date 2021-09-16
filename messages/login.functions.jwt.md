# summary

Login using JWT instead of default web-based flow. This will authenticate you with both sf and Salesforce Functions.

# examples

$ sfdx login:functions:jwt --username testuser@mycompany.org --keyfile file.key --clientid 123456

# flags.username.summary

Authentication username.

# flags.keyfile.summary

Path to JWT keyfile.

# flags.clientid.summary

OAuth client ID.

# flags.instance-url.summary

The login URL of the instance the org lives on.

# flags.json.summary

format output as json

# flags.alias.summary

Alias for the org.

# flags.set-default.summary

Set the org as the default that all org-related commands run against.

# flags.set-default-dev-hub.summary

Set the org as the default Dev Hub for scratch org creation.
