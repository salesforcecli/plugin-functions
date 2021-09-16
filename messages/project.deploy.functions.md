# summary

Deploy a Salesforce Function to an org from your local project.

# description

You must run this command from within a git repository. Only committed changes to Functions are deployed. The active branch is deployed unless specified otherwise with `--branch`.

# examples

- Deploy a Salesforce Function:

    <%= config.bin %> <%= command.id %> --connected-org=org-alias

- Deploy a Salesforce Function from a different branch than the active branch:

    <%= config.bin %> <%= command.id %> --connected-org=org-alias --branch=deploy-branch

- Deploy a Salesforce Function and overwrite the remote repository (not allowed in production):

    <%= config.bin %> <%= command.id %> --connected-org=org-alias --force

# flags.branch.summary

Deploy the latest commit from a branch different from the currently active branch.

# flags.force.summary

Ignore warnings and overwrite remote repository (not allowed in production).

# flags.quiet.summary

Limit the amount of output displayed from the deploy process.
