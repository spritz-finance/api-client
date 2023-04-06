#!/bin/sh

yarn rimraf 'src/**/__types__' &&
yarn apollo service:download --endpoint=http://localhost:4000 graphql-schema.json &&
yarn apollo codegen:generate __types__ --localSchemaFile=graphql-schema.json --target=typescript --tagName=gql &&
yarn prettier --write '**/__types__/*.ts' --loglevel=silent && yarn rimraf graphql-schema.json && yarn rimraf __types__

. export_types.sh