@echo off
echo === Starting Queue CS Gecko System ===

REM Stop any running containers
echo Stopping any existing containers...
docker-compose down

REM Remove volume for fresh start (optional - comment out if you want to keep data)
REM echo Removing old volumes...
REM docker-compose down -v

REM Start the PostgreSQL container first
echo Starting PostgreSQL...
docker-compose up -d postgres

REM Wait for PostgreSQL to be ready
echo Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak > nul
docker-compose logs postgres | findstr "database system is ready"

REM Start Supabase service
echo Starting Supabase...
docker-compose up -d supabase

REM Wait for Supabase to initialize
echo Waiting for Supabase to initialize (this might take up to a minute)...
timeout /t 30 /nobreak > nul

REM Start remaining services
echo Starting frontend and nginx...
docker-compose up -d

REM Show service status
echo.
echo === Current service status ===
docker-compose ps

REM Check if services are accessible
echo.
echo Checking if services are accessible:
echo - Frontend: http://localhost:3000
curl -s -o nul -w "Frontend: %%{http_code}\n" http://localhost:3000

echo - Supabase API: http://localhost:8000/rest/v1/
curl -s -o nul -w "Supabase API: %%{http_code}\n" http://localhost:8000/rest/v1/ -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo - Supabase Studio: http://localhost:9000
curl -s -o nul -w "Supabase Studio: %%{http_code}\n" http://localhost:9000/

echo.
echo === Queue CS Gecko System is starting ===
echo Frontend: http://localhost:3000
echo Admin URL: http://localhost:3000/admin/:queueId
echo Supabase Studio: http://localhost:9000
echo.
echo To view logs: docker-compose logs -f
echo To check Supabase health: check-supabase.bat
echo To stop: docker-compose down

REM Keep the window open
pause 