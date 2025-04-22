@echo off
echo === Fixing Queue CS Gecko System Dependency Issues ===
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo Docker detected. Checking for running frontend container...
  
  REM List containers for user to see
  echo Current running containers:
  docker ps
  echo.
  
  REM Ask user to input the container ID instead of auto-detecting
  set /p CONTAINER_ID="Enter the frontend container ID from above: "
  
  if "%CONTAINER_ID%"=="" (
    echo No container ID provided. Exiting.
    exit /b 1
  )
  
  echo Using container: %CONTAINER_ID%
  
  REM Create the scripts directory in the container
  echo Setting up dependency fix script...
  docker exec %CONTAINER_ID% mkdir -p /app/scripts
  
  REM Create a temp file with the script content
  echo #!/bin/bash > temp_script.sh
  echo echo "=== Installing Missing Dependencies in Docker Container ===" >> temp_script.sh
  echo npm install --legacy-peer-deps --save @hookform/resolvers zod >> temp_script.sh
  echo mkdir -p node_modules/@types/zod >> temp_script.sh
  echo mkdir -p node_modules/@hookform/resolvers/zod >> temp_script.sh
  echo touch src/components/ContactForm.tsx >> temp_script.sh
  echo touch src/components/JoinQueueForm.tsx >> temp_script.sh
  echo touch src/components/LoginForm.tsx >> temp_script.sh
  echo echo "Dependencies installed and files touched to trigger recompilation" >> temp_script.sh
  
  REM Copy the script to the container
  type temp_script.sh | docker exec -i %CONTAINER_ID% bash -c "cat > /app/scripts/install-dependencies.sh"
  del temp_script.sh
  
  REM Make the script executable
  docker exec %CONTAINER_ID% chmod +x /app/scripts/install-dependencies.sh
  
  REM Run the script in the container
  echo Running dependency fix inside container...
  docker exec %CONTAINER_ID% /app/scripts/install-dependencies.sh
  
  REM Restart the container
  echo Restarting container to apply changes...
  docker restart %CONTAINER_ID%
  
  echo Done! Container restarted with dependencies installed.
  echo The app should reload automatically. If issues persist, check logs with:
  echo docker logs %CONTAINER_ID%
  
) else (
  REM Running locally
  echo Running fix for local development...
  
  REM Check if we're in the frontend directory
  if not exist package.json (
    if exist frontend (
      echo Changing to frontend directory...
      cd frontend
    ) else (
      echo Not in the project root or frontend directory.
      echo Please run this script from the project root or frontend directory.
      exit /b 1
    )
  )
  
  REM Install the missing dependencies
  echo Installing missing dependencies...
  call npm install --legacy-peer-deps --save @hookform/resolvers zod
  
  REM Create directories
  mkdir node_modules\@types\zod 2>nul
  mkdir node_modules\@hookform\resolvers\zod 2>nul
  
  REM Touch files to trigger recompilation
  echo Touching files to trigger recompilation...
  for /r src %%f in (*.tsx) do (
    copy /b "%%f"+,, "%%f" >nul
  )
  
  echo Dependencies installed successfully!
  echo You may need to restart your development server:
  echo npm start
)

pause 