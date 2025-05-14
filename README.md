# Customer Support Queue System 🦎

A modern, real-time queue management system built for customer support desks. This application allows support staff to efficiently manage customer queues and provide better service with reduced wait times.

## Features

- **Real-time queue updates**: Changes to the queue are instantly reflected for both admins and visitors
- **Simple queue creation**: Support staff can quickly create queues for different support areas
- **Visitor-friendly interface**: Clear wait time information and queue position for visitors
- **Admin dashboard**: Manage customers, track wait times, and mark requests as completed
- **QR code sharing**: Easily share visitor access links via QR codes
- **Mobile-responsive**: Works well on mobile devices for both visitors and admins

## Tech Stack

- **Frontend**: React with TypeScript, Material UI
- **Backend**: Supabase (PostgreSQL database with real-time subscriptions)
- **Hosting**: Vercel
- **Authentication**: Token-based access control

## Local Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/queue-cs-gecko.git
   cd queue-cs-gecko
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file with your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_TITLE=Queue Customer Support
   REACT_APP_BASE_URL=http://localhost:3000
   ```

4. Start the development server:
   ```
   npm start
   ```

## Deployment to Vercel and Supabase

### 1. Supabase Database Setup

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)

2. Run the following SQL setup script in the Supabase SQL Editor:
   ```sql
   -- Create tables
   CREATE TABLE queue_rooms (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     description TEXT,
     status TEXT NOT NULL DEFAULT 'open',
     admin_token TEXT NOT NULL UNIQUE,
     visitor_token TEXT NOT NULL UNIQUE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE queue_items (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     queue_room_id UUID NOT NULL REFERENCES queue_rooms(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     ticket_number INTEGER NOT NULL,
     status TEXT NOT NULL DEFAULT 'waiting',
     joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     serving_at TIMESTAMP WITH TIME ZONE,
     completed_at TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE (queue_room_id, ticket_number)
   );

   -- Create RLS policies
   -- Enable Row Level Security
   ALTER TABLE queue_rooms ENABLE ROW LEVEL SECURITY;
   ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;

   -- Create policy for admin access
   CREATE POLICY "Admin Access" ON queue_rooms
     FOR ALL
     TO authenticated, anon
     USING (admin_token = current_setting('request.headers', true)::json->>'x-admin-token');

   -- Create policy for visitor access to rooms
   CREATE POLICY "Visitor Access" ON queue_rooms
     FOR SELECT 
     TO authenticated, anon
     USING (visitor_token = current_setting('request.headers', true)::json->>'x-visitor-token');

   -- Create policy for visitor access to queue items
   CREATE POLICY "Visitor Access Items" ON queue_items
     FOR SELECT
     TO authenticated, anon
     USING (
       queue_room_id IN (
         SELECT id FROM queue_rooms 
         WHERE visitor_token = current_setting('request.headers', true)::json->>'x-visitor-token'
       )
     );

   -- Create policy for admin access to queue items
   CREATE POLICY "Admin Access Items" ON queue_items
     FOR ALL
     TO authenticated, anon
     USING (
       queue_room_id IN (
         SELECT id FROM queue_rooms 
         WHERE admin_token = current_setting('request.headers', true)::json->>'x-admin-token'
       )
     );

   -- Function to get next ticket number
   CREATE OR REPLACE FUNCTION next_ticket_number(queue_room_id UUID)
   RETURNS INTEGER AS $$
   DECLARE
     max_ticket INTEGER;
   BEGIN
     SELECT COALESCE(MAX(ticket_number), 0) INTO max_ticket
     FROM queue_items
     WHERE queue_items.queue_room_id = $1;
     
     RETURN max_ticket + 1;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

3. In Supabase, enable Row Level Security for both tables and verify the policies are active

4. Enable real-time replication for the `queue_rooms` and `queue_items` tables:
   - Go to Database → Replication
   - Make sure both tables are included in the publication

### 2. Vercel Deployment

1. Fork or push your repository to GitHub/GitLab/Bitbucket

2. Create a new project on [Vercel](https://vercel.com)

3. Link your repository and configure the following environment variables:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_APP_TITLE=Queue Customer Support
   REACT_APP_BASE_URL=your_vercel_project_url
   ```

4. Deploy the application with the following settings:
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

5. After deployment, your application will be available at the Vercel URL

## Usage Instructions

### Creating a New Queue

1. Visit the homepage of the application
2. Click "Create a Queue"
3. Enter a name and optional description
4. Click "Create Queue"
5. You'll be given a unique admin link and visitor link
   - Admin Link: For support staff to manage the queue
   - Visitor Link: For customers to join the queue (can be shared via QR code)

### Administrator View

1. Access the queue using the admin link
2. You'll see all individuals in your queue sorted by wait time
3. When ready to serve the next person, click "Serve"
4. When finished with a customer, mark them as "Complete" or "No Show"
5. View statistics on the queue to track service performance

### Visitor View

1. Access the queue using the visitor link
2. Enter your name to join the queue
3. Receive your position in line and estimated wait time
4. When it's your turn, you'll be notified on-screen

## License

This project is licensed under the MIT License - see the LICENSE file for details.

