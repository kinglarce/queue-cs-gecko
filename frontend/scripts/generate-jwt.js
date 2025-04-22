/**
 * JWT Token Generator for Supabase
 * 
 * This script generates JWT tokens that can be used to authenticate with Supabase.
 * It uses the same JWT_SECRET as defined in your .env file.
 */

require('dotenv').config({ path: process.cwd().includes('frontend') ? '../.env' : './.env' });
const jwt = require('jsonwebtoken');

// Get the JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('Error: JWT_SECRET is not defined in your .env file');
  process.exit(1);
}

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
const anonToken = jwt.sign(anonPayload, JWT_SECRET);
const serviceToken = jwt.sign(servicePayload, JWT_SECRET);

// Print the tokens
console.log('=== Supabase JWT Tokens ===');
console.log('JWT Secret:', JWT_SECRET);
console.log('\nAnonymous Key:');
console.log(anonToken);
console.log('\nService Role Key:');
console.log(serviceToken);
console.log('\n=== Configuration for .env ===');
console.log('SUPABASE_ANON_KEY=' + anonToken);
console.log('SUPABASE_SERVICE_ROLE_KEY=' + serviceToken);
console.log('\n=== Configuration for docker-compose.yml ===');
console.log('SUPABASE_ANON_KEY: ' + anonToken);
console.log('SUPABASE_SERVICE_KEY: ' + serviceToken);

// Verify tokens
try {
  const verifiedAnon = jwt.verify(anonToken, JWT_SECRET);
  const verifiedService = jwt.verify(serviceToken, JWT_SECRET);
  
  console.log('\n=== Token Verification ===');
  console.log('Anonymous token verified:', JSON.stringify(verifiedAnon, null, 2));
  console.log('Service token verified:', JSON.stringify(verifiedService, null, 2));
} catch (error) {
  console.error('Token verification failed:', error.message);
} 