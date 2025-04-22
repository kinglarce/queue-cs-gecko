@echo off
echo ===== SUPABASE AUTHENTICATION FIX =====
echo This script will fix authentication issues with Supabase

REM Create .env file with correct authentication keys
echo Setting up environment variables...
(
  echo # Supabase Configuration
  echo SUPABASE_URL=http://localhost:8000
  echo SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
  echo SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.9LMdtDQybMqgw4rYkVz4qVfU7CRo9bctZO-DVODZpkg
  echo.
  echo # Frontend Configuration
  echo REACT_APP_SUPABASE_URL=http://localhost:8000
  echo REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
  echo REACT_APP_TITLE=Queue CS Gecko System
  echo REACT_APP_VERSION=1.0.0
  echo REACT_APP_API_TIMEOUT=30000
  echo REACT_APP_ENABLE_NOTIFICATIONS=true
  echo REACT_APP_ENABLE_SMS_NOTIFICATIONS=false
  echo REACT_APP_ENABLE_DARK_MODE=true
  echo REACT_APP_DEFAULT_WAIT_TIME_PER_PERSON=3
  echo REACT_APP_USE_MOCK_API=false
) > .env

REM Create a test script to verify API access
(
  echo // Test Supabase API authentication
  echo fetch('http://localhost:8000/rest/v1/queues?select=id', {
  echo   headers: {
  echo     'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  echo     'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  echo   }
  echo })
  echo .then(response =^> {
  echo   console.log('Status:', response.status);
  echo   return response.json();
  echo })
  echo .then(data =^> console.log('Data:', data))
  echo .catch(error =^> console.error('Error:', error));
) > test-supabase-auth.js

REM Update docker-compose.yml with consistent API keys
echo Updating docker-compose.yml...
(
  echo services:
  echo   frontend:
  echo     build:
  echo       context: ./frontend
  echo       dockerfile: Dockerfile
  echo       args:
  echo         - REACT_APP_SUPABASE_URL=http://localhost:8000
  echo         - REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
  echo         - REACT_APP_TITLE=Queue CS Gecko System
  echo         - REACT_APP_VERSION=1.0.0
  echo         - REACT_APP_API_TIMEOUT=30000
  echo         - REACT_APP_ENABLE_NOTIFICATIONS=true
  echo         - REACT_APP_ENABLE_SMS_NOTIFICATIONS=false
  echo         - REACT_APP_ENABLE_DARK_MODE=true
  echo         - REACT_APP_DEFAULT_WAIT_TIME_PER_PERSON=3
  echo     image: cs-gecko-queue-frontend
  echo     ports:
  echo       - "3000:3000"
  echo     volumes:
  echo       - ./frontend:/app
  echo       - /app/node_modules
  echo     environment:
  echo       - NODE_ENV=development
  echo       - REACT_APP_USE_MOCK_API=false
  echo       - REACT_APP_SUPABASE_URL=http://localhost:8000
  echo       - REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
  echo       - REACT_APP_TITLE=Queue CS Gecko System
  echo       - REACT_APP_VERSION=1.0.0
  echo       - REACT_APP_API_TIMEOUT=30000
  echo       - REACT_APP_ENABLE_NOTIFICATIONS=true
  echo       - REACT_APP_ENABLE_SMS_NOTIFICATIONS=false
  echo       - REACT_APP_ENABLE_DARK_MODE=true
  echo       - REACT_APP_DEFAULT_WAIT_TIME_PER_PERSON=3
  echo       - CHOKIDAR_USEPOLLING=true
  echo       - WDS_SOCKET_PORT=0
  echo     healthcheck:
  echo       test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000"]
  echo       interval: 30s
  echo       timeout: 10s
  echo       retries: 3
  echo       start_period: 40s
  echo     depends_on:
  echo       postgres:
  echo         condition: service_healthy
  echo       supabase:
  echo         condition: service_started
  echo     restart: unless-stopped
  echo.
  echo   postgres:
  echo     image: postgres:14
  echo     ports:
  echo       - "5432:5432"
  echo     environment:
  echo       POSTGRES_PASSWORD: postgres
  echo       POSTGRES_USER: postgres
  echo       POSTGRES_DB: postgres
  echo     command: postgres -c config_file=/etc/postgresql/postgresql.conf
  echo     volumes:
  echo       - pg_data:/var/lib/postgresql/data
  echo       - ./supabase/init.sql:/docker-entrypoint-initdb.d/init.sql
  echo       - ./supabase/postgres.conf:/etc/postgresql/postgresql.conf
  echo     healthcheck:
  echo       test: ["CMD", "pg_isready", "-U", "postgres"]
  echo       interval: 5s
  echo       timeout: 5s
  echo       retries: 5
  echo.
  echo   supabase:
  echo     image: supabase/supabase-dev:latest
  echo     depends_on:
  echo       postgres:
  echo         condition: service_healthy
  echo     restart: always
  echo     ports:
  echo       - "8000:8000"
  echo       - "9000:9000"
  echo     environment:
  echo       POSTGRES_PASSWORD: postgres
  echo       POSTGRES_USER: postgres
  echo       POSTGRES_DB: postgres
  echo       POSTGRES_HOST: postgres
  echo       POSTGRES_PORT: 5432
  echo       SUPABASE_URL: http://localhost:8000
  echo       SUPABASE_PORT: 8000
  echo       SUPABASE_REST_PORT: 8000
  echo       KONG_PORT: 8000
  echo       STUDIO_PORT: 9000
  echo       SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
  echo       SUPABASE_SERVICE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.9LMdtDQybMqgw4rYkVz4qVfU7CRo9bctZO-DVODZpkg
  echo       JWT_SECRET: super-secret-jwt-token-with-at-least-32-characters-long
  echo     healthcheck:
  echo       test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8000/rest/v1/"]
  echo       interval: 30s
  echo       timeout: 5s
  echo       retries: 3
  echo       start_period: 30s
  echo.
  echo   nginx:
  echo     image: nginx:alpine
  echo     ports:
  echo       - "80:80"
  echo     volumes:
  echo       - ./nginx/nginx.conf:/etc/nginx/nginx.conf
  echo       - ./nginx/conf.d:/etc/nginx/conf.d
  echo     depends_on:
  echo       - frontend
  echo       - supabase
  echo     restart: unless-stopped
  echo.
  echo volumes:
  echo   pg_data:
) > docker-compose.yml.new

echo Creating configuration overrides...
mkdir -p supabase/config

REM Create kong auth override configuration
mkdir -p supabase/config
(
  echo _format_version: "1.1"
  echo services:
  echo - name: rest
  echo   url: http://kong:8000/rest
  echo   routes:
  echo   - name: rest-all
  echo     paths:
  echo     - /rest
  echo   plugins:
  echo   - name: cors
  echo   - name: key-auth
  echo     config:
  echo       hide_credentials: false
  echo       key_names:
  echo       - apikey
  echo       run_on_preflight: true
) > supabase/config/kong.yml

echo Stopping containers and restarting with new configuration...
docker-compose down

echo Replacing docker-compose.yml with fixed version...
move /y docker-compose.yml.new docker-compose.yml

echo Starting PostgreSQL...
docker-compose up -d postgres

timeout /t 10 /nobreak > nul
echo Starting Supabase with fixed keys...
docker-compose up -d supabase

echo Waiting for Supabase to initialize (45 seconds)...
timeout /t 45 /nobreak > nul
echo Starting frontend...
docker-compose up -d frontend

echo Waiting for services to start (15 seconds)...
timeout /t 15 /nobreak > nul
echo Starting nginx...
docker-compose up -d nginx

echo Testing Supabase API access...
curl -s -o nul -w "Status: %%{http_code}\n" http://localhost:8000/rest/v1/queues?select=id -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo.
echo ===== AUTH FIX COMPLETED =====
echo The application should now be accessible at http://localhost:3000
echo Supabase Studio should be accessible at http://localhost:9000
echo.
echo If you still have issues, please:
echo 1. Run the debug-supabase.bat script to generate detailed logs
echo 2. Try using mock API mode by setting REACT_APP_USE_MOCK_API=true in .env
echo 3. Check browser console for any frontend errors
echo.

pause 