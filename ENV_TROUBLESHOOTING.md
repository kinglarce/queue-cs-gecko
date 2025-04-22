# Environment Variables Troubleshooting Guide

This guide helps resolve common issues with environment variables in the Queue CS Gecko System.

## Common Issues

### 1. Supabase Connection Issues

If you're experiencing connection issues with Supabase, it's often due to mismatched API keys across different parts of the application.

#### Symptoms:
- 401 Unauthorized errors in the frontend
- "Invalid API key" messages in the console
- API calls to Supabase failing
- Queue creation or ticket management not working

#### Solution:

1. **Check for key consistency**: Ensure the Supabase API keys are consistent across all these locations:
   - `.env` file
   - `nginx/conf.d/default.conf`
   - `docker-compose.yml`
   - Test scripts like `check-supabase.bat/sh`

2. **Run the connection test script**:
   ```
   node test-supabase-connection.js
   ```
   This will test the connection to Supabase using your environment variables.

3. **Restart the services**:
   ```
   docker-compose down
   docker-compose up -d
   ```

### 2. Frontend Not Loading Environment Variables

If the frontend isn't picking up the correct environment variables:

#### Symptoms:
- Console logs showing fallback values being used
- Frontend using different API keys than configured

#### Solution:

1. **Rebuild the frontend container**:
   ```
   docker-compose up -d --build frontend
   ```

2. **Verify environment variables are passed to container**:
   ```
   docker-compose exec frontend env | grep REACT_APP
   ```

### 3. Database Reset

If you need to start fresh with a clean database:

```
docker-compose down
docker volume rm queue_pg_data
docker-compose up -d
```

## Using the Fix Scripts

We've included several helpful scripts to address common issues:

1. **Check Supabase Health**:
   - Windows: `check-supabase.bat`
   - Linux/Mac: `./check-supabase.sh`

2. **Fix PostgreSQL WAL Level**:
   - Windows: `fix-postgres.bat`
   - Linux/Mac: `./fix-postgres.sh`

3. **Test Supabase Connection**:
   ```
   node test-supabase-connection.js
   ```

## Environment Variable Reference

Here are the key environment variables used in the project:

| Variable | Purpose | Where Used |
|----------|---------|------------|
| `SUPABASE_URL` | Supabase API URL | Backend, Scripts |
| `SUPABASE_ANON_KEY` | Public API key for Supabase | Backend, Scripts, Nginx |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin API key (sensitive) | Backend only |
| `REACT_APP_SUPABASE_URL` | Supabase URL for frontend | Frontend only |
| `REACT_APP_SUPABASE_ANON_KEY` | Public API key for frontend | Frontend only |

## Best Practices

1. Never commit your actual `.env` file to version control
2. Keep a well-documented `.env.example` file
3. After making changes to environment variables, restart all services
4. Check the application logs for environment-related errors 