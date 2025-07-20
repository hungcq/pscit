# Library Management System Frontend

This is the frontend application for the Library Management System, built with React, TypeScript, and Ant Design.

## Features

- User authentication (login/register)
- Book browsing and searching
- Book details view
- Book reservation system
- Admin dashboard for managing books and reservations
- User profile and reservation history

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

Create a `.env` file in the frontend directory with the following content:
```
VITE_API_URL=http://localhost:3001/api
```

## Development

To start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:3000.

## Building for Production

To create a production build:
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/
  ├── components/       # Reusable components
  ├── contexts/        # React contexts
  ├── pages/          # Page components
  ├── services/       # API services
  ├── types/          # TypeScript type definitions
  ├── App.tsx         # Main application component
  └── index.tsx       # Application entry point
```

## Technologies Used

- React
- TypeScript
- Ant Design
- React Router
- Axios
- Context API for state management

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## Next.js Migration

This project is being migrated to Next.js for improved SEO and static site generation (SSG/ISR). Pages are generated at build time and can be hosted on S3 + CDN.

### Development

```
npm run dev
```

### Build static site

```
npm run build
```

### Start production server (for SSR/ISR)

```
npm run start
```

### S3/CDN Hosting
- After `npm run build`, use `.next/static` and `out/` for static export if needed.
- See Next.js docs for [Static HTML Export](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports).
