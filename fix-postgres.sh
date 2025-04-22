#!/bin/bash

# Colors for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Fixing PostgreSQL WAL Level for Supabase ===${NC}"

# Stop containers
echo -e "${YELLOW}Stopping containers...${NC}"
docker-compose down

# Remove PostgreSQL data volume to start fresh
echo -e "${YELLOW}Removing PostgreSQL data volume...${NC}"
docker volume rm queue_pg_data

# Create postgres.conf if it doesn't exist
if [ ! -f "supabase/postgres.conf" ]; then
  echo -e "${YELLOW}Creating PostgreSQL configuration file...${NC}"
  mkdir -p supabase
  cat > supabase/postgres.conf << EOF
# PostgreSQL configuration file for Supabase
# Required settings for Supabase realtime functionality

# Write-Ahead Log settings
wal_level = logical      # Required for logical replication and Supabase realtime
max_wal_senders = 10     # Max number of walsender processes
max_replication_slots = 10  # Max number of replication slots

# Performance settings
shared_buffers = 128MB   # Min 128MB for good performance
work_mem = 16MB          # Memory for query operations
maintenance_work_mem = 64MB  # Memory for maintenance operations
EOF
fi

# Start PostgreSQL container first
echo -e "${YELLOW}Starting PostgreSQL container...${NC}"
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 10

# Start Supabase
echo -e "${YELLOW}Starting Supabase...${NC}"
docker-compose up -d supabase

# Wait for Supabase to initialize
echo -e "${YELLOW}Waiting for Supabase to initialize (this might take up to a minute)...${NC}"
sleep 30

# Start remaining services
echo -e "${YELLOW}Starting remaining services...${NC}"
docker-compose up -d

# Display service status
echo -e "${GREEN}\n=== Services Status ===${NC}"
docker-compose ps

# Verify Supabase health
echo -e "${GREEN}\n=== Verifying Supabase Health ===${NC}"
echo -e "${YELLOW}Checking Supabase API:${NC}"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/rest/v1/ -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo -e "${YELLOW}Checking Supabase Studio:${NC}"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9000/

echo -e "${GREEN}\n=== Fix Complete ===${NC}"
echo -e "If you still have issues, run: docker-compose logs supabase"
echo -e "You may need to wait a few more minutes for all services to fully initialize." 