#!/bin/bash

# Install main dependencies
npm install --legacy-peer-deps

# Install required additional packages
npm install --legacy-peer-deps --save @hookform/resolvers zod class-variance-authority

# Create necessary directories if they don't exist
mkdir -p node_modules/@hookform/resolvers/zod

# Echo success message
echo "Setup complete. Dependencies installed." 