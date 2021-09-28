# summary

Create a Salesforce Function with basic scaffolding specific to a given language.

# description

Both '--language' and '--name' are required flags. Function names must start with a capital letter.

# examples

- Create a JavaScript function:

  <%= config.bin %> <%= command.id %> --function-name MyFunction --language javascript

# flags.function-name.summary

Function name. Must start with a capital letter.

# flags.language.summary

Language. Can be one of: javascript, typescript, java.

# flags.name.deprecation

--name is deprecated and will be removed in a future release. Please use --function-name going forward.
