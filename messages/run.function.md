# summary

Send a cloudevent to a function.

# description

# examples

- Run a function:

  <%= config.bin %> <%= command.id %> --url http://path/to/function

- Run a function with a payload and a JSON response:

  <%= config.bin %> <%= command.id %> --url http://path/to/function --payload '@file.json' --structured

# flags.function-url.summary

URL of the function to run.

# flags.headers.summary

Set headers.

# flags.payload.summary

Set the payload of the cloudevent as a JSON object or a path to a file via @file.json.

# flags.structured.summary

Set the cloudevent to be emitted as a structured JSON cloudevent.

# flags.connected-org.summary

Username or alias for the target org; overrides default target org.

# flags.url.deprecation

--url is deprecated and will be removed in a future release. Please use --function-url going forward.
