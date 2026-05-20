# Cottonunique - MySQL Version

A sustainable tote bag e-commerce platform built with React, TypeScript, and MySQL.

## Prerequisites

- Node.js (v18 or higher)
- MySQL Server (v8.0 or higher)
- npm or yarn

## Database Setup

1. Install MySQL Server on your system
2. Create a new database:
   ```sql
   CREATE DATABASE cottonunique_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. Import the database schema:
   ```bash
   mysql -u root -p cottonunique_db < database/mysql_schema.sql
   ```

## Environment Configuration

1. Copy the `.env` file and update the database credentials:
   ```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cottonunique_db
   DB_USER=root
   DB_PASSWORD=your_password_here
   VITE_API_URL=http://localhost:3001/api
   ```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Development Mode (Frontend + Backend)
```bash
npm run dev:full
```

This will start:
- Backend API server on http://localhost:3001
- Frontend development server on http://localhost:5173

### Individual Services

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
npm run dev
```

## API Endpoints

- `GET /api/products` - Get all active products
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get single product
- `POST /api/inquiries` - Submit customer inquiry
- `GET /api/content/:sectionKey` - Get content section
- `GET /api/health` - Health check

## Database Schema

The application uses three main tables:

### Products
- Product catalog with specifications, images, and pricing
- Support for featured products and categories
- JSON fields for flexible specifications and gallery images

### Inquiries
- Customer contact form submissions
- Order type tracking and status management

### Content Sections
- Dynamic content management for homepage sections
- JSON content structure for flexibility

## Migration from Supabase

This version has been migrated from Supabase to MySQL:
- ✅ Database schema converted to MySQL format
- ✅ API endpoints created with Express.js
- ✅ Frontend updated to use REST API
- ✅ Environment variables updated
- ✅ Supabase dependencies removed

## Production Deployment

1. Set up MySQL database on your production server
2. Update environment variables for production
3. Build the frontend: `npm run build`
4. Deploy the backend API server
5. Serve the built frontend files

## Features

- 🌱 Sustainable product catalog
- 📱 Responsive design
- 🎨 Modern UI with Tailwind CSS
- 📧 Contact form with inquiry management
- 🏷️ Dynamic content management
- 🔍 Product search and filtering
- 📊 MySQL database with optimized queries