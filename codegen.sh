#!/bin/sh

find . -type d -name "__types__" -exec rm -r {} + &&
yarn apollo service:download --header="X-API-KEY: $INTROSPECTION_KEY" --endpoint=https://api-staging.spritz.finance/router/graph-introspection  graphql-schema.json &&
yarn apollo codegen:generate __types__  --globalTypesFile=src/types/globalTypes.ts --localSchemaFile=graphql-schema.json --target=typescript --tagName=gql &&
yarn oxfmt --no-error-on-unmatched-pattern 'src/**/__types__/*.ts' && yarn rimraf graphql-schema.json 
. export_types.sh
