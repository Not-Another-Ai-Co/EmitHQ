#!/usr/bin/env bash
# Check that all API routes in the codebase are documented in the OpenAPI spec.
# Exits non-zero if a route exists in code but not in the spec.
set -eo pipefail

SPEC="packages/landing/public/openapi.json"

if [ ! -f "$SPEC" ]; then
  echo "ERROR: OpenAPI spec not found at $SPEC"
  exit 1
fi

node scripts/check-openapi-drift.mjs
