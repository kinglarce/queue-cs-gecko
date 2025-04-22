# Scripts Directory

This directory contains utility scripts for the Queue CS Gecko System.

## Available Scripts

### generate-jwt.js

This script generates JWT tokens that can be used to authenticate with Supabase.

#### Purpose
- Creates Supabase-compatible JWT tokens using the JWT_SECRET from your .env file
- Generates both anonymous user and service role tokens
- Verifies the tokens to ensure they're valid
- Outputs configuration for both .env and docker-compose.yml files

#### Usage
Run from the project root:
```bash
npm run generate-jwt
```

or directly:
```bash
node scripts/generate-jwt.js
```

#### Output
The script outputs:
1. The JWT secret used for signing
2. The newly generated anonymous key
3. The newly generated service role key
4. Configuration snippets for .env and docker-compose.yml
5. Verification results for both tokens 