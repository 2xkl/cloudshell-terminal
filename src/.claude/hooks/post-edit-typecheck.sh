#!/bin/bash
# Post-edit hook: TypeScript type checking
# Runs after each file edit to catch type errors early

cd "$(dirname "$0")/../../backend" 2>/dev/null || exit 0

# Quick typecheck (non-blocking)
npx tsc --noEmit --pretty 2>&1 | head -20

exit 0  # Don't block on errors
