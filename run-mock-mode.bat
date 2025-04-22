@echo off
echo ===== RUNNING APPLICATION IN MOCK API MODE =====
echo This is a fallback option when Supabase integration fails

REM Create a mock API environment file
echo Setting up environment for mock API mode...
(
  echo # Mock API Configuration
  echo REACT_APP_USE_MOCK_API=true
  echo REACT_APP_MOCK_API_URL=http://localhost:8000
  echo REACT_APP_SUPABASE_URL=http://localhost:8000
  echo REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
  echo REACT_APP_TITLE=Queue CS Gecko System (Mock Mode)
  echo REACT_APP_VERSION=1.0.0
  echo REACT_APP_API_TIMEOUT=30000
  echo REACT_APP_ENABLE_NOTIFICATIONS=true
  echo REACT_APP_ENABLE_SMS_NOTIFICATIONS=false
  echo REACT_APP_ENABLE_DARK_MODE=true
  echo REACT_APP_DEFAULT_WAIT_TIME_PER_PERSON=3
) > .env.mock

REM Make sure the JSON server data file exists
if not exist db.json (
  echo Creating mock database file...
  (
    echo {
    echo   "queues": [
    echo     {
    echo       "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    echo       "name": "Demo Queue",
    echo       "admin_secret": "demo-admin-secret",
    echo       "created_at": "2023-11-21T12:00:00Z",
    echo       "updated_at": "2023-11-21T12:00:00Z",
    echo       "status": "active"
    echo     }
    echo   ],
    echo   "tickets": [
    echo     {
    echo       "id": "a29e3f8d-6a1e-41f8-a8c0-d71e36931781",
    echo       "queue_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    echo       "name": "John Doe",
    echo       "ticket_number": 1,
    echo       "status": "waiting",
    echo       "created_at": "2023-11-21T12:05:00Z",
    echo       "updated_at": "2023-11-21T12:05:00Z"
    echo     },
    echo     {
    echo       "id": "b3e8d7c6-5a4f-4e2d-9b1c-0f9e8d7c6b5a",
    echo       "queue_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    echo       "name": "Jane Smith",
    echo       "ticket_number": 2,
    echo       "status": "waiting",
    echo       "created_at": "2023-11-21T12:10:00Z",
    echo       "updated_at": "2023-11-21T12:10:00Z"
    echo     }
    echo   ]
    echo }
  ) > db.json
)

REM Stop all running containers
echo Stopping any running containers...
docker-compose down

REM Start JSON Server for mock API
echo Starting JSON Server for mock API...
start "JSON Server" cmd /c "npx json-server --watch db.json --port 8000"

REM Wait for JSON Server to start
echo Waiting for JSON Server to start... (5 seconds)
timeout /t 5 /nobreak > nul

REM Copy the mock environment file
echo Copying mock environment to .env...
copy /y .env.mock .env

REM Create a frontend-only docker-compose file
echo Creating frontend-only docker-compose...
(
  echo services:
  echo   frontend:
  echo     build:
  echo       context: ./frontend
  echo       dockerfile: Dockerfile
  echo     image: cs-gecko-queue-frontend
  echo     ports:
  echo       - "3000:3000"
  echo     volumes:
  echo       - ./frontend:/app
  echo       - /app/node_modules
  echo     environment:
  echo       - NODE_ENV=development
  echo       - REACT_APP_USE_MOCK_API=true
  echo       - REACT_APP_MOCK_API_URL=http://host.docker.internal:8000
  echo       - REACT_APP_SUPABASE_URL=http://host.docker.internal:8000
  echo       - REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
  echo       - REACT_APP_TITLE=Queue CS Gecko System (Mock Mode)
  echo       - REACT_APP_VERSION=1.0.0
  echo       - REACT_APP_API_TIMEOUT=30000
  echo       - REACT_APP_ENABLE_NOTIFICATIONS=true
  echo       - REACT_APP_ENABLE_SMS_NOTIFICATIONS=false
  echo       - REACT_APP_ENABLE_DARK_MODE=true
  echo       - REACT_APP_DEFAULT_WAIT_TIME_PER_PERSON=3
  echo       - CHOKIDAR_USEPOLLING=true
  echo       - WDS_SOCKET_PORT=0
  echo     extra_hosts:
  echo       - "host.docker.internal:host-gateway"
  echo     restart: unless-stopped
) > docker-compose.mock.yml

echo Starting frontend in mock mode...
docker-compose -f docker-compose.mock.yml up -d

echo.
echo ===== APPLICATION IS RUNNING IN MOCK MODE =====
echo Frontend: http://localhost:3000
echo Mock API: http://localhost:8000
echo.
echo The application is now using JSON Server as a mock API backend.
echo You can create, read, update, and delete data, but it will only persist in the db.json file.
echo.
echo To stop the application:
echo 1. Press Ctrl+C to stop this script
echo 2. Run 'docker-compose -f docker-compose.mock.yml down' to stop the frontend
echo 3. Close the JSON Server window
echo.

pause 