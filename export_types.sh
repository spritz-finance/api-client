#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

create_index() {
    local dir="$1"
    local index_file="${dir}/index.ts"

    if [[ ! -d "$dir" ]]; then
        echo "Directory not found: $dir" >&2
        return 1
    fi

    printf "// Auto-generated index file\n" > "$index_file"

    while IFS= read -r file; do
        local filename module_name
        filename="$(basename "$file")"
        module_name="${filename%.ts}"
        printf "export * from './%s'\n" "$module_name" >> "$index_file"
    done < <(find "$dir" -maxdepth 1 -type f -name '*.ts' ! -name 'index.ts' | sort)

    echo "Generated gql types index file: $index_file"
}

directories=("src/graph/queries/__types__")

for dir in "${directories[@]}"; do
    create_index "$dir"
done

yarn oxfmt --no-error-on-unmatched-pattern 'src/**/__types__/index.ts'
