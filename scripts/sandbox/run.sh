#!/usr/bin/env bash
# Run a sandbox script with a fresh build.
#
# Usage:
#   ./scripts/sandbox/run.sh setup-user [args...]
#   ./scripts/sandbox/run.sh list-bank-accounts
#   ./scripts/sandbox/run.sh list-off-ramps

set -euo pipefail
cd "$(dirname "$0")/../.."

SCRIPT="${1:?Usage: run.sh <script-name> [args...]}"
shift

echo "Building..."
yarn build --silent
echo "Build OK"
echo ""

exec yarn tsx "scripts/sandbox/${SCRIPT}.ts" "$@"
