# summary

Create a compute environment for use with Salesforce Functions.

# description

Compute environments must be connected to a Salesforce org. By default the command uses your local environment's connected org. Use the '--connected-org' flag to specify a specific org.

# examples

- Create a compute environment to run Salesforce Functions:

    <%= config.bin %> <%= command.id %>

- Connect the environment to a specific org:

    <%= config.bin %> <%= command.id %> --connected-org=org-alias

- Create an alias for the compute environment:

    <%= config.bin %> <%= command.id %> --setalias environment-alias

# flags.connected-org.summary

The alias or username of connected Salesforce org.

# flags.alias.summary

Alias for the created environment.

# flags.setalias.deprecation

--setalias is deprecated and will be removed in a future release. Please use --alias going forward.
