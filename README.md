# Queue CS Gecko System 🦎

A modern digital queue management system designed to streamline customer service operations. This application allows organizations to create digital queues, manage customer flow, and provide real-time updates to visitors.

## 🚀 Features

- **Digital Queue Management**: Create and manage multiple queues
- **Real-time Updates**: Customers receive instant updates about their position
- **QR Code Integration**: Easy queue joining via QR code scanning
- **Admin Dashboard**: Manage queues, call next customers, and view statistics
- **Estimated Wait Times**: Automatically calculate and display wait times
- **Responsive Design**: Works on all devices, from mobile to large displays

## 🛠️ Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **State Management**: React Hooks, Context API
- **Backend Options**:
  - **Production**: Supabase (PostgreSQL + APIs)
  - **Development**: JSON Server (mock API)
- **Deployment**:
  - **Frontend**: Vercel
  - **Backend**: Supabase Cloud

## 🔧 Development Setup

### Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- Node.js (v16+) and npm/yarn (for local development without Docker)

### Quick Start with Docker (Recommended)

The simplest way to get everything running:

#### On Windows:

```bash
# Run the startup script
start.bat
```

#### On macOS/Linux:

```bash
# Make script executable
chmod +x start.sh

# Run the startup script
./start.sh
```

This will:
1. Start PostgreSQL database
2. Start Supabase API
3. Start the frontend application
4. Configure nginx for routing

Then open http://localhost:3000 in your browser

### Without Docker (Advanced)

If you want to run components individually:

1. Set up PostgreSQL and run the SQL scripts from `supabase/migrations/`

2. Start a local Supabase instance or use a cloud Supabase instance

3. Configure the frontend to connect to your Supabase instance:
   ```bash
   cd frontend
   # Configure environment variables
   cp ../.env.example .env.local
   # Edit .env.local with your Supabase URL and anon key
   
   # Start frontend
   npm install
   npm start
   ```

## 🔍 Troubleshooting

### Database Connection Errors

If you see database connection errors in Supabase logs:

1. Ensure PostgreSQL is running and healthy:
   ```bash
   docker-compose ps
   ```

2. Check PostgreSQL logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify the migrations were applied:
   ```bash
   docker-compose exec postgres psql -U postgres -c "SELECT * FROM pg_tables WHERE schemaname='public'"
   ```

4. Restart Supabase:
   ```bash
   docker-compose restart supabase
   ```

### Frontend Connection Issues

If the frontend can't connect to Supabase:

1. Check browser console for errors

2. Verify nginx configuration:
   ```bash
   docker-compose exec nginx nginx -t
   ```

3. Check nginx logs:
   ```bash
   docker-compose logs nginx
   ```

4. Try directly accessing Supabase API:
   ```
   curl http://localhost:8000/rest/v1/
   ```

## 📊 Production Deployment

### Setting up Supabase (Backend)

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Run the SQL scripts from `supabase/migrations` to set up your database schema

3. Enable Row-Level Security (RLS) and set up appropriate policies

4. Note your Supabase URL and anon key for frontend deployment

### Deploying to Vercel (Frontend)

1. Fork or clone this repository to your GitHub account

2. Sign up for [Vercel](https://vercel.com) and create a new project

3. Connect your GitHub repository to Vercel

4. Set the following environment variables in Vercel:
   - `REACT_APP_SUPABASE_URL`: Your Supabase project URL
   - `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `REACT_APP_USE_MOCK_API`: Set to "false" for production

5. Deploy your application

The included `vercel.json` configuration file will handle the build process and optimizations automatically.

## 🔄 Alternative Backend Options

### Firebase

To use Firebase instead of Supabase:

1. Create a Firebase project and set up Firestore

2. Update the service layer in `src/services/api.ts` to use Firebase SDK

```typescript
// Example Firebase implementation (you'll need to adapt the existing functions)
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, ... } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  // ... other firebase config
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Update service methods to use Firestore instead of Supabase
// ...
```

## 🧬 Scaling Considerations

This application is designed to handle 1000+ concurrent users with the following considerations:

### Performance Optimizations

- **Data Caching**: Implemented in frontend to reduce API calls
- **Optimistic UI Updates**: Instant feedback for user actions, with background syncing
- **Lazy Loading**: Components and routes load only when needed
- **Asset Optimization**: Compressed images and efficient bundle splitting

### Supabase Scaling

- **Database Performance**: Use indexes for common queries
- **Realtime Events**: Optimized Supabase realtime subscriptions 
- **Edge Functions**: For complex backend logic that should run close to users

### Vercel Scaling

Vercel automatically scales to handle traffic spikes with:
- Global CDN for static assets
- Edge network for API routes
- Automatic handling of concurrent users

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ by CS Gecko Team 
