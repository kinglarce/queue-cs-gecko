# Security Best Practices

This document outlines security best practices for the Queue CS Gecko System.

## Environment Variables and Secrets

### Managing Sensitive Data

1. **Never commit sensitive data to Git**
   - API keys, database credentials, and other secrets should be stored in environment variables, not in code
   - Use `.env` files locally but do not commit them to version control
   - Use `.env.example` as a template showing required variables without real values

2. **Environment Setup**
   - Copy `.env.example` to `.env` and fill in your own values:
   ```bash
   cp .env.example .env
   ```
   - Use the script to generate secure JWT tokens:
   ```bash
   npm run generate-jwt
   ```

3. **Docker Setup**
   - Docker Compose uses variables from your `.env` file
   - Environment variables in Docker Compose are exported to containers
   - The nginx configuration uses templates with variables from the environment

## Securing Docker Containers

1. **Use environment variables for configuration**
   - All sensitive values are passed as environment variables
   - The Docker containers use these variables at runtime

2. **Avoid hardcoded credentials**
   - Credentials are not hardcoded in configuration files
   - Configuration files use variable substitution

3. **Keep containers updated**
   - Regularly update Docker images to get security patches
   - Use fixed versions for dependencies to ensure consistency

## Securing the Application

1. **Use HTTPS in production**
   - Configure nginx with SSL certificates
   - Redirect all HTTP traffic to HTTPS

2. **Rotate credentials regularly**
   - Change JWT secrets and database passwords regularly
   - Use the script to generate new JWT tokens when needed:
   ```bash
   npm run generate-jwt
   ```

3. **Limit API access**
   - Use Rate Limiting for API endpoints
   - Set proper CORS headers to restrict access

## Secure Development Workflow

1. **Local development**
   - Use mock APIs for development when possible
   - Set `REACT_APP_USE_MOCK_API=true` for local development

2. **Code reviews**
   - Check for hardcoded credentials
   - Verify proper environment variable usage

3. **Dependency management**
   - Regularly update dependencies
   - Use `npm audit` to check for vulnerabilities 