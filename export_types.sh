#!/bin/bash

create_index() {
  dir="$1"
  index_file="${dir}/index.ts"

  if [ ! -d "$dir" ]; then
    echo "Directory not found: $dir"
    return
  fi

  echo "// Auto-generated index file" > "$index_file"
  for file in "$dir"/*.ts; do
    filename=$(basename "$file")
    if [ "$filename" != "index.ts" ]; then
      module_name="${filename%.ts}"
      echo "export * from './$module_name';" >> "$index_file"
    fi
  done

  echo "Generated gql types index file: $index_file"
}

directories=("src/graph/queries/__types__")

for dir in "${directories[@]}"; do
  create_index "$dir"
done

yarn prettier --write '**/__types__/index.ts' --loglevel=silent