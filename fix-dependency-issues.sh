#!/bin/bash

# Colors for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Fixing Queue CS Gecko System Dependency Issues ===${NC}"

# Check if using Docker
if command -v docker &> /dev/null && docker ps &> /dev/null; then
  echo -e "${YELLOW}Docker detected. Checking for running frontend container...${NC}"
  
  # Get the frontend container ID
  CONTAINER_ID=$(docker ps | grep cs-gecko-queue-frontend | awk '{print $1}')
  
  if [ -z "$CONTAINER_ID" ]; then
    echo -e "${RED}Frontend container not found. Is it running?${NC}"
    echo "Try running: docker-compose up -d"
    exit 1
  fi
  
  echo -e "${GREEN}Frontend container found: $CONTAINER_ID${NC}"
  
  # Create the scripts directory if it doesn't exist
  echo -e "${YELLOW}Setting up dependency fix script...${NC}"
  docker exec $CONTAINER_ID mkdir -p /app/scripts
  
  # Create the fix script inside the container
  docker exec $CONTAINER_ID bash -c 'cat > /app/scripts/install-dependencies.sh << EOF
#!/bin/bash
echo "=== Installing Missing Dependencies in Docker Container ==="
npm install --legacy-peer-deps --save @hookform/resolvers zod
mkdir -p node_modules/@types/zod
mkdir -p node_modules/@hookform/resolvers/zod
touch src/components/ContactForm.tsx
touch src/components/JoinQueueForm.tsx
touch src/components/LoginForm.tsx
echo "Dependencies installed and files touched to trigger recompilation"
EOF'
  
  # Make the script executable
  docker exec $CONTAINER_ID chmod +x /app/scripts/install-dependencies.sh
  
  # Run the script in the container
  echo -e "${YELLOW}Running dependency fix inside container...${NC}"
  docker exec $CONTAINER_ID /app/scripts/install-dependencies.sh
  
  # Restart the container
  echo -e "${YELLOW}Restarting container to apply changes...${NC}"
  docker restart $CONTAINER_ID
  
  echo -e "${GREEN}Done! Container restarted with dependencies installed.${NC}"
  echo "The app should reload automatically. If issues persist, check logs with:"
  echo "docker logs $CONTAINER_ID"
  
else
  # Running locally, not in Docker
  echo -e "${YELLOW}Running fix for local development...${NC}"
  
  # Check if we're in the frontend directory
  if [ ! -f "package.json" ]; then
    if [ -d "frontend" ]; then
      echo "Changing to frontend directory..."
      cd frontend
    else
      echo -e "${RED}Not in the project root or frontend directory.${NC}"
      echo "Please run this script from the project root or frontend directory."
      exit 1
    fi
  fi
  
  # Install the missing dependencies
  echo -e "${YELLOW}Installing missing dependencies...${NC}"
  npm install --legacy-peer-deps --save @hookform/resolvers zod
  
  # Create directories
  mkdir -p node_modules/@types/zod
  mkdir -p node_modules/@hookform/resolvers/zod
  
  # Touch files to trigger recompilation
  echo -e "${YELLOW}Touching files to trigger recompilation...${NC}"
  find src -name "*.tsx" -exec touch {} \;
  
  echo -e "${GREEN}Dependencies installed successfully!${NC}"
  echo "You may need to restart your development server:"
  echo "npm start"
fi 