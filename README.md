# Queue CS Gecko System 🦎

A modern, digital queue management system designed to streamline customer service operations, reduce perceived wait times, and improve overall customer experience.

## 🚀 Features

- **Virtual Queue Management**: Eliminate physical lines with a digital waiting system
- **Real-time Updates**: Customers receive live updates about their position in queue
- **QR-Code Integration**: Easy queue joining through scannable QR codes
- **Admin Dashboard**: Manage queues, call next customers, and view statistics
- **Wait Time Estimation**: Automatically calculate and display estimated wait times
- **Form Components**: Modular, reusable form components built with React Hook Form and Zod
- **Mobile Responsive**: Optimized for both desktop and mobile experiences

## 📋 Table of Contents

- [Technologies](#-technologies)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Usage](#-usage)
  - [Customer Flow](#customer-flow)
  - [Admin Flow](#admin-flow)
  - [Form System](#form-system)
- [Docker](#-docker)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)
- [License](#-license)

## 🛠 Technologies

- **Frontend**:
  - React 18 with TypeScript
  - React Router for navigation
  - React Hook Form for form management
  - Zod for validation
  - TailwindCSS for styling
  - Zustand for state management

- **Backend**:
  - Supabase for database and authentication
  - PostgreSQL for data storage
  - Row-Level Security for data protection

- **Infrastructure**:
  - Docker for containerization
  - Nginx for reverse proxy

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Docker](https://www.docker.com/) and Docker Compose
- [Git](https://git-scm.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/queue-cs-gecko.git
   cd queue-cs-gecko
   ```

2. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start the Docker containers:
   ```bash
   docker-compose up --build
   ```

4. The application will be available at:
   - Frontend: http://localhost:3000
   - Supabase API: http://localhost:8000
   - Supabase Studio: http://localhost:9000

### Environment Variables

Key environment variables that can be configured in `.env`:

```
# Supabase Configuration
SUPABASE_URL=http://localhost:8000
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# React App Variables
REACT_APP_SUPABASE_URL=http://localhost:8000
REACT_APP_SUPABASE_ANON_KEY=<your-anon-key>

# Feature Flags
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_SMS_NOTIFICATIONS=false
REACT_APP_ENABLE_DARK_MODE=true

# Settings
REACT_APP_DEFAULT_WAIT_TIME_PER_PERSON=3
```

## 🧑‍💻 Usage

### Customer Flow

1. **Join the Queue**:
   - Scan the QR code at the establishment
   - Fill in your details (name, email, phone)
   - Receive a confirmation with your position in line

2. **Wait Anywhere**:
   - Track your position in the queue
   - Receive updates as you move up in the queue
   - Get notified when it's almost your turn

3. **Service Time**:
   - Receive a notification when it's your turn
   - Proceed to the service point

### Admin Flow

1. **Create a Queue**:
   - Set up a new queue with a name
   - Receive admin credentials for management

2. **Manage Queue**:
   - View all customers in the queue
   - Call the next customer
   - Skip or reorder customers if needed
   - Reset the queue at the end of the day

3. **Display Options**:
   - Set up a public display screen showing current status
   - Print QR code posters for customers to scan

### Form System

The system includes a reusable form component library:

- `Form`: The main container component
- `FormField`: Connects to React Hook Form
- `FormInput`: Pre-styled input elements
- `FormSection`: Groups related fields
- `FormActions`: Container for form buttons
- `FormMessage`: Displays validation messages

Example usage:

```tsx
<Form form={form} onSubmit={handleSubmit}>
  <FormSection title="Personal Details">
    <FormField name="name">
      <Input label="Your Name" required />
    </FormField>
  </FormSection>
  <FormActions>
    <Button type="submit">Submit</Button>
  </FormActions>
</Form>
```

## 🐳 Docker

The application is containerized using Docker with three main services:

1. **Frontend**: React application
2. **Supabase**: PostgreSQL database with Supabase API
3. **Nginx**: Reverse proxy for routing

To rebuild after changes:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## 🗄️ Database Schema

The system uses two main tables:

### Queues Table
Stores information about different queues in the system.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Queue name |
| admin_secret | TEXT | Secret key for admin access |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| status | TEXT | Queue status (active, paused, closed, archived) |

### Tickets Table
Represents customers waiting in queues.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| queue_id | UUID | Foreign key to queues table |
| name | TEXT | Customer name |
| ticket_number | INTEGER | Position in queue |
| status | TEXT | Ticket status (waiting, serving, served, skipped, archived) |
| created_at | TIMESTAMPTZ | When customer joined |
| updated_at | TIMESTAMPTZ | Last status update |
| completed_at | TIMESTAMPTZ | When service completed |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ by CS Gecko Team 
