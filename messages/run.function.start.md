# summary

Build and run a Salesforce Function.

# description

Run this command from the directory of your Salesforce Functions project.

This command will run the target function locally (on the same operating system as this CLI), just like the `local` subcommand.

Previously, this command ran functions in a container. Container mode is still supported via the `container` subcommand. Arguments relevant to container mode are still accepted, but are deprecated, ignored, and will be dropped in a future release.

# flags.builder.summary

Set custom builder image. Deprecated.

# flags.clear-cache.summary

Clear associated cache before executing. Deprecated.

# flags.debug-port.summary

Port for remote debugging.

# flags.descriptor.summary

Path to project descriptor file (project.toml) that contains function and/or bulid configuration. Deprecated.

# flags.env.summary

Set environment variables (provided during build and run). Deprecated.

# flags.language.summary

The language that the function runs in.

# flags.network.summary

Connect and build containers to a network. This can be useful to build containers which require a local resource. Deprecated.

# flags.no-build.summary

Skip building the an image. Deprecated.

# flags.no-pull.summary

Skip pulling builder image before use. Deprecated.

# flags.no-run.summary

Skip running the built image. Deprecated.

# flags.path.summary

Path to function directory.

# flags.port.summary

Port for running the function.

# flags.verbose.summary

Output additional logs.
