#!/bin/bash
# Pre-commit hook: Run tests and typecheck before commit
# Should be linked to git pre-commit hook

set -e

echo "Running pre-commit checks..."

# Backend checks
cd "$(dirname "$0")/../../backend"
echo "Backend: TypeScript check..."
npx tsc --noEmit

echo "Backend: Running tests..."
npm run test

# Frontend checks
cd "$(dirname "$0")/../../frontend"
echo "Frontend: TypeScript check..."
npx tsc --noEmit

echo "Frontend: Running tests..."
npm run test

echo "All pre-commit checks passed!"
