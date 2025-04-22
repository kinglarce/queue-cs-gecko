#!/bin/bash

# Script to install missing dependencies in the Docker container
# To run:
# docker exec -it <container_id> /app/scripts/install-dependencies.sh

echo "=== Installing Missing Dependencies in Docker Container ==="

# Make the script executable
chmod +x "$0"

# Check current directory
echo "Current directory: $(pwd)"

# Try installing the dependencies with legacy peer deps
npm install --legacy-peer-deps --save @hookform/resolvers zod
if [ $? -ne 0 ]; then
  echo "Failed to install dependencies with npm. Trying yarn..."
  yarn add @hookform/resolvers zod
fi

# Check if the installation was successful
if [ -d "node_modules/zod" ] && [ -d "node_modules/@hookform/resolvers" ]; then
  echo "Dependencies installed successfully!"
  
  # Create directories to ensure TypeScript typings are available
  mkdir -p node_modules/@types/zod
  mkdir -p node_modules/@hookform/resolvers/zod
  
  # Touch files to ensure they're recompiled
  find src -name "*.tsx" -exec touch {} \;
  
  echo "Files touched to trigger recompilation"
  echo "You may need to restart the container for changes to take effect"
else
  echo "Error: Dependencies not installed correctly. Please check for errors above."
  exit 1
fi 