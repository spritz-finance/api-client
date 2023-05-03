#!/bin/sh

find . -type d -name "__types__" -exec rm -r {} + &&
yarn apollo service:download --endpoint=http://localhost:4000 graphql-schema.json &&
yarn apollo codegen:generate __types__  --globalTypesFile=src/types/globalTypes.ts --localSchemaFile=graphql-schema.json --target=typescript --tagName=gql &&
yarn prettier --write '**/__types__/*.ts' --loglevel=silent && yarn rimraf graphql-schema.json 
. export_types.sh