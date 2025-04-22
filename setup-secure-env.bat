@echo off
echo === Setting up Queue CS Gecko System Securely ===
echo.

REM Check if .env file already exists
if exist .env (
  echo Warning: .env file already exists.
  set /p overwrite=Do you want to overwrite it? (y/n): 
  if /i NOT "%overwrite%"=="y" (
    echo Keeping existing .env file.
    goto :EOF
  )
)

REM Create .env file from template
echo Creating .env file from template...
copy .env.example .env

REM Change to frontend directory to run JWT script
cd frontend

REM Run the generate-jwt script
echo Generating Supabase tokens...
call npm run generate-jwt

REM Extract keys from the output and update .env
cd ..
echo.
echo Environment setup needs to be completed manually:
echo.
echo 1. Copy the SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY values from above
echo 2. Open the .env file in a text editor
echo 3. Replace "your_anon_key_here" with the SUPABASE_ANON_KEY value
echo 4. Replace "your_service_role_key_here" with the SUPABASE_SERVICE_ROLE_KEY value
echo 5. Replace "your_secure_password_here" with a strong password
echo 6. Replace "your_secure_jwt_secret_here" with a secure random string
echo.
echo After completing these steps:
echo 1. Start your application with: docker-compose up -d
echo 2. If you need to regenerate tokens later, run: npm run generate-jwt
echo.
echo Would you like to open the .env file now?
set /p open_env=Open .env file? (y/n):

if /i "%open_env%"=="y" (
  start notepad .env
) 