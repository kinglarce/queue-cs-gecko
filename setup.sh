#!/bin/bash

# Make directories
mkdir -p volumes/db

# Start the services
echo "Starting Supabase services..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Execute initialization script
echo "Initializing database..."
docker-compose exec postgres psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/init.sql

# Start remaining services
echo "Starting remaining services..."
docker-compose up -d

echo "Supabase is now running!"
echo "Studio URL: http://localhost:3000"
echo "API URL: http://localhost:8000"
echo "Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldi1hbm9uLWtleSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjE0MjEyMzYyLCJleHAiOjE5Mjk3ODgzNjJ9.zqdHRKBYGjJTUf6_H-qBXwMj_stP4aMhzGYYRLsKEQE" 