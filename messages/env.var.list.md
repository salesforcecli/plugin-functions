# summary

List your environment's config vars in a table.

# description

Use the '--json' flag to return config vars in JSON format.

# examples

- List config vars:

  <%= config.bin %> <%= command.id %> --target-compute environment-alias

- List in JSON format:

  <%= config.bin %> <%= command.id %> --target-compute environment-alias --json

# flags.target-compute.summary

Compute environment to get config vars from.

# flags.json.summary

Output result in JSON.

# flags.environment.deprecation

--environment is deprecated and will be removed in a future release. Please use --target-compute going forward.
