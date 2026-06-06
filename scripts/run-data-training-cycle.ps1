node "$PSScriptRoot\collect-demo-data.mjs" --events=10000 --telemetry=30000
node "$PSScriptRoot\preprocess-collected-data.mjs"
node "$PSScriptRoot\train-operational-models.mjs"
