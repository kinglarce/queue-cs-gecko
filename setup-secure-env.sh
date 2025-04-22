#!/bin/bash

# Colors for better visibility
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Setting up Queue CS Gecko System Securely ===${NC}"

# Check if .env file already exists
if [ -f ".env" ]; then
  echo -e "${RED}Warning: .env file already exists.${NC}"
  read -p "Do you want to overwrite it? (y/n): " overwrite
  if [ "$overwrite" != "y" ]; then
    echo "Keeping existing .env file."
    exit 0
  fi
fi

# Create .env file from template
echo -e "${YELLOW}Creating .env file from template...${NC}"
cp .env.example .env

# Generate a secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}Generated JWT secret${NC}"

# Update the JWT secret in .env
sed -i "s/your_secure_jwt_secret_here/$JWT_SECRET/g" .env

# Generate a secure PostgreSQL password
PG_PASSWORD=$(openssl rand -base64 16)
echo -e "${GREEN}Generated PostgreSQL password${NC}"

# Update the PostgreSQL password in .env
sed -i "s/your_secure_password_here/$PG_PASSWORD/g" .env

# Generate Supabase JWT tokens
echo -e "${YELLOW}Generating Supabase tokens...${NC}"
cd frontend || exit 1
NODE_ENV=development node -e "
const jwt = require('jsonwebtoken');
const jwtSecret = '$JWT_SECRET';

// Generate an anonymous key
const anonPayload = {
  iss: 'supabase',
  ref: 'dev-anon-key',
  role: 'anon',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 years
};

// Generate a service role key
const servicePayload = {
  iss: 'supabase',
  ref: 'dev-service-key',
  role: 'service_role',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (10 * 365 * 24 * 60 * 60) // 10 years
};

// Sign the tokens
const anonToken = jwt.sign(anonPayload, jwtSecret);
const serviceToken = jwt.sign(servicePayload, jwtSecret);

console.log('ANON_KEY=' + anonToken);
console.log('SERVICE_KEY=' + serviceToken);
" > ../temp_tokens.txt
cd ..

# Extract tokens
ANON_KEY=$(grep ANON_KEY temp_tokens.txt | cut -d= -f2)
SERVICE_KEY=$(grep SERVICE_KEY temp_tokens.txt | cut -d= -f2)
rm temp_tokens.txt

echo -e "${GREEN}Generated Supabase tokens${NC}"

# Update tokens in .env
sed -i "s/your_anon_key_here/$ANON_KEY/g" .env
sed -i "s/your_service_role_key_here/$SERVICE_KEY/g" .env

echo -e "${GREEN}Environment setup complete!${NC}"
echo -e "${YELLOW}Important:${NC} Your .env file now contains secure randomly generated values."
echo -e "1. Review the .env file to make sure all values are set correctly."
echo -e "2. Start your application with: docker-compose up -d"
echo -e "3. If you need to regenerate tokens later, run: npm run generate-jwt" 