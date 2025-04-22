@echo off
echo === Fixing PostgreSQL WAL Level for Supabase ===

REM Stop containers
echo Stopping containers...
docker-compose down

REM Remove PostgreSQL data volume to start fresh
echo Removing PostgreSQL data volume...
docker volume rm queue_pg_data

REM Check if postgres.conf exists and create it if it doesn't
if not exist supabase\postgres.conf (
  echo Creating PostgreSQL configuration file...
  mkdir supabase 2>nul
  (
    echo # PostgreSQL configuration file for Supabase
    echo # Required settings for Supabase realtime functionality
    echo.
    echo # Write-Ahead Log settings
    echo wal_level = logical      # Required for logical replication and Supabase realtime
    echo max_wal_senders = 10     # Max number of walsender processes
    echo max_replication_slots = 10  # Max number of replication slots
    echo.
    echo # Performance settings
    echo shared_buffers = 128MB   # Min 128MB for good performance
    echo work_mem = 16MB          # Memory for query operations
    echo maintenance_work_mem = 64MB  # Memory for maintenance operations
  ) > supabase\postgres.conf
)

REM Start PostgreSQL container first
echo Starting PostgreSQL container...
docker-compose up -d postgres

REM Wait for PostgreSQL to be ready
echo Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak > nul

REM Start Supabase
echo Starting Supabase...
docker-compose up -d supabase

REM Wait for Supabase to initialize
echo Waiting for Supabase to initialize (this might take up to a minute)...
timeout /t 30 /nobreak > nul

REM Start remaining services
echo Starting remaining services...
docker-compose up -d

REM Display service status
echo.
echo === Services Status ===
docker-compose ps

REM Verify Supabase health
echo.
echo === Verifying Supabase Health ===
echo Checking Supabase API:
curl -s -o nul -w "%%{http_code}\n" http://localhost:8000/rest/v1/ -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo Checking Supabase Studio:
curl -s -o nul -w "%%{http_code}\n" http://localhost:9000/

echo.
echo === Fix Complete ===
echo If you still have issues, run: docker-compose logs supabase
echo You may need to wait a few more minutes for all services to fully initialize.

pause 