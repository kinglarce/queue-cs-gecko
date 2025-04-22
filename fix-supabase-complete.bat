@echo off
echo ===== COMPREHENSIVE SUPABASE FIX SCRIPT =====
echo This script will completely reset and reconfigure your Supabase setup

REM Check if Docker is running
echo Checking if Docker is running...
docker info >nul 2>&1
if %errorlevel% neq 0 (
  echo ERROR: Docker is not running. Please start Docker Desktop first.
  pause
  exit /b 1
)

REM Stop all containers
echo Stopping all containers...
docker-compose down

REM Remove all volumes to start fresh
echo Removing volumes for a clean start...
docker volume rm queue_pg_data

REM Create or update postgres.conf
echo Setting up PostgreSQL configuration file...
mkdir supabase 2>nul
(
  echo # PostgreSQL configuration file for Supabase
  echo # Required settings for Supabase realtime functionality
  echo.
  echo # Write-Ahead Log settings
  echo wal_level = logical         # Required for logical replication and Supabase realtime
  echo max_wal_senders = 10        # Max number of walsender processes
  echo max_replication_slots = 10  # Max number of replication slots
  echo.
  echo # Connection settings
  echo listen_addresses = '*'      # Listen on all interfaces
  echo max_connections = 100       # Maximum connections
  echo.
  echo # Performance settings
  echo shared_buffers = 128MB      # Min 128MB for good performance
  echo work_mem = 16MB             # Memory for query operations
  echo maintenance_work_mem = 64MB # Memory for maintenance operations
  echo.
  echo # Security settings
  echo password_encryption = md5   # Password encryption method
) > supabase\postgres.conf

REM Create or update init.sql
echo Setting up initialization SQL script...
(
  echo -- Init script for PostgreSQL database
  echo.
  echo -- Enable required extensions
  echo CREATE EXTENSION IF NOT EXISTS pgcrypto;
  echo CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  echo.
  echo -- Create a test table to verify functionality
  echo CREATE TABLE IF NOT EXISTS public.test_table ^(
  echo     id uuid PRIMARY KEY DEFAULT uuid_generate_v4^(^),
  echo     name TEXT NOT NULL,
  echo     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW^(^)
  echo ^);
  echo.
  echo -- Insert test data
  echo INSERT INTO public.test_table ^(name^) VALUES ^('Test entry'^) ON CONFLICT DO NOTHING;
  echo.
  echo -- Grant permissions
  echo ALTER USER postgres WITH SUPERUSER;
) > supabase\init.sql

REM Start PostgreSQL container separately first
echo Starting PostgreSQL container...
docker-compose up -d postgres

REM Wait for PostgreSQL to be ready
echo Waiting for PostgreSQL to initialize ^(10 seconds^)...
timeout /t 10 /nobreak > nul

REM Test PostgreSQL connection
echo Testing PostgreSQL connection...
docker-compose exec postgres pg_isready -U postgres
if %errorlevel% neq 0 (
  echo PostgreSQL is not responding. There might be an issue with the container.
  echo Checking PostgreSQL logs:
  docker-compose logs postgres
  pause
  exit /b 1
)

REM Verify WAL level is set correctly
echo Verifying PostgreSQL WAL level configuration...
docker-compose exec postgres psql -U postgres -c "SHOW wal_level;"

REM Start Supabase container
echo Starting Supabase container...
docker-compose up -d supabase

REM Wait for Supabase to initialize
echo Waiting for Supabase to initialize ^(40 seconds^)...
timeout /t 40 /nobreak > nul

REM Start remaining services
echo Starting remaining services...
docker-compose up -d

REM Display service status
echo.
echo === Services Status ===
docker-compose ps

REM Check PostgreSQL logs
echo.
echo === PostgreSQL Logs ===
docker-compose logs --tail=10 postgres

REM Check Supabase logs
echo.
echo === Supabase Logs ===
docker-compose logs --tail=10 supabase

REM Verify Supabase health
echo.
echo === Verifying Supabase Health ===
echo Checking Supabase API:
curl -s -o nul -w "%%{http_code}\n" http://localhost:8000/rest/v1/ -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo Checking Supabase Studio:
curl -s -o nul -w "%%{http_code}\n" http://localhost:9000/

echo.
echo === Setup Complete ===
echo If you still have issues:
echo 1. Check container logs with: docker-compose logs supabase
echo 2. Verify PostgreSQL is running: docker-compose logs postgres
echo 3. Try accessing Supabase Studio at: http://localhost:9000
echo.
echo NOTE: It may take a few more minutes for all services to fully initialize.

pause 