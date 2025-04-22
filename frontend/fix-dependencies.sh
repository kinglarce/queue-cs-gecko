#!/bin/bash

echo "=== Installing Missing Dependencies ==="

# Install dependencies with legacy peer deps to avoid TypeScript conflicts
npm install --legacy-peer-deps --save @hookform/resolvers zod

# Create types directory if it doesn't exist
mkdir -p node_modules/@types/zod

# Check if the installation was successful
if [ -d "node_modules/zod" ] && [ -d "node_modules/@hookform/resolvers" ]; then
  echo "Dependencies installed successfully!"
  
  # Touch the files to trigger recompilation
  touch src/components/ContactForm.tsx
  touch src/components/JoinQueueForm.tsx
  touch src/components/LoginForm.tsx
  
  echo "TypeScript files touched to trigger recompilation"
else
  echo "Error: Dependencies were not installed correctly."
  exit 1
fi

# Restart the application
echo "Restarting application..."
npm start 