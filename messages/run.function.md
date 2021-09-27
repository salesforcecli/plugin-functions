# summary

Send a cloudevent to a function.

# examples

- $ sfdx run:function -l http://localhost:8080 -p '{"id": 12345}'
- $ sfdx run:function -l http://localhost:8080 -p '@file.json'
- $ echo '{"id": 12345}' | sfdx run:function -l http://localhost:8080
- $ sfdx run:function -l http://localhost:8080 -p '{"id": 12345}' --structured

# flags.function-url.summary

Url of the function to run.

# flags.headers.summary

Set headers.

# flags.payload.summary

Set the payload of the cloudevent. also accepts @file.txt format.

# flags.structured.summary

Set the cloudevent to be emitted as a structured cloudevent (json).

# flags.connected-org.summary

Username or alias for the target org; overrides default target org.

# flags.url.deprecation

--url is deprecated and will be removed in a future release. Please use --function-url going forward.
