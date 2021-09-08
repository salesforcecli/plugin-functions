# summary

Build and run function image locally.

# examples

- $ sfdx run:function:start
- $ sfdx run:function:start -e VAR=VALUE
- $ sfdx run:function:start --network host --no-pull --clear-cache --debug-port 9000 --port 5000

# flags.builder.summary

Set custom builder image.

# flags.path.summary

Path to function dir.

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
