# Library Management System

A modern library management system built with Go (backend) and React (frontend).

## Features

- View and search books with filters
- Book reservations with email notifications
- Google OAuth authentication
- Admin dashboard for managing books and users
- FAQ section
- Email notifications for new books and reservations

## Prerequisites

- Go 1.23 or higher
- Node.js 16 or higher
- PostgreSQL 12 or higher
- Google Cloud Platform account (for OAuth)

## Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Go dependencies:
   ```bash
   go mod download
   ```

3. Copy the environment file and update the values:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration values.

5. Run the backend server:
   ```bash
   go run main.go
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Environment Variables

### Backend (.env)

- `PORT`: Server port (default: 8080)
- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port
- `DB_USER`: PostgreSQL user
- `DB_PASSWORD`: PostgreSQL password
- `DB_NAME`: Database name
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_REDIRECT_URL`: OAuth redirect URL
- `JWT_SECRET`: JWT signing key
- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP server port
- `SMTP_USERNAME`: SMTP username
- `SMTP_PASSWORD`: SMTP password
- `RESERVATION_EXPIRY_HOURS`: Book reservation expiry time in hours

## API Documentation

The API documentation is available at `/api/docs` when running the server.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 