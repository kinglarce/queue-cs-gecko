@echo off
echo ===== SUPABASE DEBUGGING TOOL =====
echo This script will help diagnose Supabase connectivity issues

set DEBUG_FILE=supabase-debug-%date:~-4,4%%date:~-7,2%%date:~-10,2%.log
echo. > %DEBUG_FILE%

REM Function to log to both console and file
call :log "Starting Supabase debug process..." 

REM Check Docker status
call :log "Checking Docker status..."
docker info > nul 2>&1
if %errorlevel% neq 0 (
  call :log "ERROR: Docker is not running. Please start Docker Desktop first."
  goto end
) else (
  call :log "Docker is running."
)

REM Check container status
call :log "Checking container status..."
docker-compose ps >> %DEBUG_FILE%
for /f "tokens=1" %%i in ('docker-compose ps -q postgres') do set PG_CONTAINER=%%i
for /f "tokens=1" %%i in ('docker-compose ps -q supabase') do set SUPABASE_CONTAINER=%%i

if "%PG_CONTAINER%"=="" (
  call :log "PostgreSQL container is not running!"
) else (
  call :log "PostgreSQL container ID: %PG_CONTAINER%"
)

if "%SUPABASE_CONTAINER%"=="" (
  call :log "Supabase container is not running!"
) else (
  call :log "Supabase container ID: %SUPABASE_CONTAINER%"
)

REM Check PostgreSQL connection
if not "%PG_CONTAINER%"=="" (
  call :log "Testing PostgreSQL connection..."
  docker-compose exec -T postgres pg_isready -U postgres
  if %errorlevel% neq 0 (
    call :log "ERROR: Cannot connect to PostgreSQL!"
  ) else (
    call :log "PostgreSQL is accepting connections."
    
    REM Check PostgreSQL configuration
    call :log "Checking PostgreSQL WAL level..."
    docker-compose exec -T postgres psql -U postgres -c "SHOW wal_level;" >> %DEBUG_FILE%
    
    call :log "Checking PostgreSQL listen_addresses..."
    docker-compose exec -T postgres psql -U postgres -c "SHOW listen_addresses;" >> %DEBUG_FILE%
    
    call :log "Checking PostgreSQL port..."
    docker-compose exec -T postgres psql -U postgres -c "SHOW port;" >> %DEBUG_FILE%
    
    call :log "Listing PostgreSQL databases..."
    docker-compose exec -T postgres psql -U postgres -c "\l" >> %DEBUG_FILE%
  )
)

REM Check Supabase connection
if not "%SUPABASE_CONTAINER%"=="" (
  call :log "Testing Supabase API connection..."
  curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:8000/rest/v1/ -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" >> %DEBUG_FILE%
  
  call :log "Testing Supabase Studio connection..."
  curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:9000/ >> %DEBUG_FILE%
  
  call :log "Checking Supabase container environment variables..."
  docker inspect %SUPABASE_CONTAINER% | findstr "POSTGRES_HOST" >> %DEBUG_FILE%
  docker inspect %SUPABASE_CONTAINER% | findstr "POSTGRES_PORT" >> %DEBUG_FILE%
  docker inspect %SUPABASE_CONTAINER% | findstr "POSTGRES_USER" >> %DEBUG_FILE%
  docker inspect %SUPABASE_CONTAINER% | findstr "POSTGRES_PASSWORD" >> %DEBUG_FILE%
)

REM Check PostgreSQL logs
call :log "Checking PostgreSQL logs..."
docker-compose logs --tail=20 postgres >> %DEBUG_FILE%

REM Check Supabase logs
call :log "Checking Supabase logs..."
docker-compose logs --tail=30 supabase >> %DEBUG_FILE%

REM Check network connectivity between containers
call :log "Checking network connectivity between containers..."
if not "%SUPABASE_CONTAINER%"=="" if not "%PG_CONTAINER%"=="" (
  call :log "Testing connection from Supabase to PostgreSQL..."
  docker exec %SUPABASE_CONTAINER% ping -c 3 postgres >> %DEBUG_FILE% 2>&1
)

call :log "--------------------------------"
call :log "Debug information saved to %DEBUG_FILE%"
call :log "Please review this file for detailed diagnostics."

call :log "------------------------------------------------------------------------------"
call :log "RECOMMENDED SOLUTION:"
call :log "1. Try switching to the standard Postgres image with this command:"
call :log "   copy docker-compose.fixed.yml docker-compose.yml"
call :log "2. Then run the complete fix script:"
call :log "   fix-supabase-complete.bat"
call :log "3. If issues persist, share the debug log file with your support team."
call :log "------------------------------------------------------------------------------"

:end
pause
exit /b

:log
echo %~1
echo %~1 >> %DEBUG_FILE%
exit /b 