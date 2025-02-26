#!/bin/bash

# Generate the config file first
echo "Generating config file..."
node generate-config.js

# Start http-server with:
# -c-1: Disable caching
# --cors: Enable CORS
# -o: Open browser automatically
# -p 8080: Use port 8080 (you can change this)
echo "Starting development server..."
npx http-server . -c-1 --cors -o -p 8080 