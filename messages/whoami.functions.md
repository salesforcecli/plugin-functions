# summary

Show information on your Salesforce Functions login.

# description

Returns your email and ID. Use '--show-token' to show your Salesforce Functions token.

# examples

- Get account information:

  <%= config.bin %> <%= command.id %>

- Show token and output result as JSON:

  <%= config.bin %> <%= command.id %> --show-token --json

# flags.show-token.summary

Show the stored functions token.

# flags.json.summary

Format response as JSON.