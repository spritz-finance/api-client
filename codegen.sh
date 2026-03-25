#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="$(mktemp "${SCRIPT_DIR}/graphql-schema.XXXXXX.json")"

cleanup() {
    rm -f "$SCHEMA_FILE"
}

trap cleanup EXIT

cd "$SCRIPT_DIR"

find src/graph -type d -name "__types__" -prune -exec rm -rf {} +

yarn apollo service:download \
    --header="X-API-KEY: ${INTROSPECTION_KEY:?INTROSPECTION_KEY is required}" \
    --endpoint="https://api-staging.spritz.finance/router/graph-introspection" \
    "$SCHEMA_FILE"

yarn apollo codegen:generate __types__ \
    --globalTypesFile=src/types/globalTypes.ts \
    --localSchemaFile="$SCHEMA_FILE" \
    --target=typescript \
    --tagName=gql

yarn oxfmt --no-error-on-unmatched-pattern 'src/**/__types__/*.ts'

bash "$SCRIPT_DIR/export_types.sh"
