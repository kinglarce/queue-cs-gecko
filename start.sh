#!/bin/bash

# Make script executable with: chmod +x start.sh

# Function to check if Docker is running
check_docker() {
  if ! docker info > /dev/null 2>&1; then
    echo "🛑 Docker is not running. Please start Docker and try again."
    exit 1
  fi
}

# Function to check if containers are ready
check_containers() {
  local max_attempts=30
  local attempt=1
  
  echo "⏳ Waiting for services to be ready..."
  
  # Check Supabase API availability
  while [ $attempt -le $max_attempts ]; do
    if curl -s http://localhost:8000/rest/v1/ > /dev/null; then
      echo "✅ Supabase API is available!"
      break
    fi
    
    if [ $attempt -eq $max_attempts ]; then
      echo "❌ Supabase API failed to become available in time."
      echo "  Check container logs with: docker-compose logs supabase"
      exit 1
    fi
    
    attempt=$((attempt+1))
    sleep 2
  done
}

# Main execution
echo "🚀 Starting Queue Management System"

# Check Docker
check_docker

# Check if this is the first run
if [ ! -f "./frontend/src/App.tsx" ]; then
  echo "📁 First run detected, setting up project structure..."
  mkdir -p frontend/src/components frontend/src/pages frontend/src/utils
fi

# Start the containers
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Check container health
check_containers

# Create basic Supabase client file if it doesn't exist
if [ ! -f "./frontend/src/utils/supabase.ts" ]; then
  echo "📝 Creating Supabase client file..."
  mkdir -p frontend/src/utils
  cat > frontend/src/utils/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'http://localhost:8000';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldi1hbm9uLWtleSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjE0MjEyMzYyLCJleHAiOjE5Mjk3ODgzNjJ9.zqdHRKBYGjJTUf6_H-qBXwMj_stP4aMhzGYYRLsKEQE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Queue management functions
export const createQueueRoom = async (name: string, description: string) => {
  const adminToken = Math.random().toString(36).substring(2, 15) + 
                     Math.random().toString(36).substring(2, 15);
  const visitorToken = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
  
  const { data, error } = await supabase.from('queue_rooms').insert({
    name,
    description,
    admin_token: adminToken,
    visitor_token: visitorToken
  }).select();
  
  return { data, error };
};

export const joinQueue = async (queueRoomId: string, name: string) => {
  // Get next ticket number
  const { data: nextTicketData } = await supabase.rpc('next_ticket_number', {
    queue_room_id: queueRoomId
  });
  
  const ticketNumber = nextTicketData || 1;
  
  const { data, error } = await supabase.from('queue_items').insert({
    queue_room_id: queueRoomId,
    name,
    status: 'waiting',
    ticket_number: ticketNumber
  }).select();
  
  return { data, error };
};
EOF
fi

echo "✨ Setup complete! Your Queue Management System is running."
echo "📊 Supabase Dashboard: http://localhost:9000"
echo "🔑 API URL: http://localhost:8000"
echo "🖥️ Frontend: http://localhost:3000"
echo ""
echo "Development credentials:"
echo "SUPABASE_URL=http://localhost:8000"
echo "SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRldi1hbm9uLWtleSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjE0MjEyMzYyLCJleHAiOjE5Mjk3ODgzNjJ9.zqdHRKBYGjJTUf6_H-qBXwMj_stP4aMhzGYYRLsKEQE" 