# summary

Build and run a Salesforce Function locally.

# description

Run this command from the directory of your Salesforce Functions project.

# examples

- Build a function and start the invoker

  <%= config.bin %> <%= command.id %>

- Start the invoker with a specific language and port

  <%= config.bin %> <%= command.id %> --port 5000 --language javascript

# flags.path.summary

Path to function directory.

# flags.port.summary

Port to bind the invoker to.

# flags.debug-port.summary

Port to use for debbugging the function.

# flags.language.summary

The language in which the function is written.
