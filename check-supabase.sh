#!/bin/bash

echo "=== Checking Supabase Health ==="

echo
echo "Docker container status:"
docker-compose ps supabase

echo
echo "Checking Supabase API:"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/rest/v1/ -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo
echo "Checking Supabase Studio:"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9000/

echo
echo "Checking Supabase through Nginx:"
curl -s -o /dev/null -w "%{http_code}\n" http://localhost/supabase/rest/v1/ -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo
echo "Supabase container logs (last 20 lines):"
docker-compose logs --tail=20 supabase

echo
echo "=== Health Check Complete ==="
echo
echo "If you're still having issues, try the following steps:"
echo "1. Restart Supabase: docker-compose restart supabase"
echo "2. Check if PostgreSQL is running: docker-compose ps postgres"
echo "3. Rebuild the containers: docker-compose up -d --build" 