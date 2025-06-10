#!/bin/bash

# Check if any staged files are in the frontend directory
if git diff --cached --name-only | grep -q '^frontend/'; then
  echo "🔧 Changes detected in /frontend. Running npm build check..."
  (cd frontend && npm run build)
  status=$?

  if [ $status -ne 0 ]; then
    echo "❌ Build failed. Commit aborted."
    exit 1
  fi

  echo "✅ Build succeeded."
else
  echo "ℹ️  No changes in /frontend — skipping npm build."
fi

exit 0
