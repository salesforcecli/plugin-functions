# summary

Create a compute environment for use with Salesforce Functions.

# description

Compute environments must be connected to a Salesforce org. By default the command uses your local environment's connected org. Use the '--connected-org' flag to specify a specific org. Run 'sf env list' to see a list of environments.

# examples

- Create a compute environment to run Salesforce Functions:

  <%= config.bin %> <%= command.id %>

- Connect the environment to a specific org:

  <%= config.bin %> <%= command.id %> --connected-org=org-alias

- Create an alias for the compute environment:

  <%= config.bin %> <%= command.id %> --alias environment-alias

# flags.connected-org.summary

The alias or username of the connected Salesforce org.

# flags.alias.summary

Alias for the created environment.
