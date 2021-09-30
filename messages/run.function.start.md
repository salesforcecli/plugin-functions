# summary

Build and run a Salesforce Function locally.

# description

Run this command from the directory of your Salesforce Functions project.

# examples

- Build and run a function:

  <%= config.bin %> <%= command.id %>

- Run a function on a specific port with additional logs:

  <%= config.bin %> <%= command.id %> --port 5000 --verbose

- Add environment variables and specify a network:

  <%= config.bin %> <%= command.id %> --env KEY=VALUE --network host

# flags.builder.summary

Set custom builder image.

# flags.path.summary

Path to function directory.

# flags.port.summary

Port for running the function.

# flags.debug-port.summary

Port for remote debugging.

# flags.clear-cache.summary

Clear associated cache before executing.

# flags.no-pull.summary

Skip pulling builder image before use.

# flags.no-build.summary

Skip building the an image.

# flags.no-run.summary

Skip running the built image.

# flags.env.summary

Set environment variables (provided during build and run).

# flags.network.summary

Connect and build containers to a network. This can be useful to build containers which require a local resource.

# flags.verbose.summary

Output additional logs.

# flags.descriptor.summary

Path to project descriptor file (project.toml) that contains function and/or bulid configuration.
