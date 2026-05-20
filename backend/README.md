# Cottonunique Backend API

A Node.js/Express REST API for the Cottonunique e-commerce platform with MySQL database.

## Features

- 🚀 Express.js REST API
- 🗄️ MySQL database with connection pooling
- 🔒 CORS configuration for frontend integration
- 📝 TypeScript support
- 🔄 Hot reload with nodemon
- 🏗️ Database setup scripts

## Prerequisites

- Node.js (v18 or higher)
- MySQL Server (v8.0 or higher)
- npm or yarn

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your MySQL credentials.

3. Setup database:
   ```bash
   npm run setup-db
   ```

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## Production

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## API Endpoints

### Products
- `GET /api/products` - Get all active products
- `GET /api/products/featured` - Get featured products
- `GET /api/products/:id` - Get single product by ID

### Inquiries
- `POST /api/inquiries` - Submit customer inquiry

### Content
- `GET /api/content/:sectionKey` - Get content section by key

### Health
- `GET /api/health` - Health check endpoint

## Database Schema

The application uses three main tables:

### Products
- Product catalog with specifications and images
- Support for featured products and categories
- JSON fields for flexible specifications and gallery images

### Inquiries
- Customer contact form submissions
- Order type tracking and status management

### Content Sections
- Dynamic content management for homepage sections
- JSON content structure for flexibility

## Environment Variables

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cottonunique_db
DB_USER=root
DB_PASSWORD=your_password_here

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Inquiry email notifications (optional; if set, inquiries are emailed to cottonunique.co@gmail.com)
EMAIL_USER=cottonunique.co@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password
# Optional: override recipient (default: cottonunique.co@gmail.com)
# INQUIRY_RECIPIENT_EMAIL=cottonunique.co@gmail.com
```

**Inquiry email:** When a user submits "Send Inquiry" on the contact form, the backend can send a notification to `cottonunique.co@gmail.com`. Set `EMAIL_USER` and `EMAIL_APP_PASSWORD` (Gmail [App Password](https://support.google.com/accounts/answer/185833)) in `.env`. If these are not set, inquiries are still saved to the database but no email is sent.

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run setup-db` - Initialize database with schema and sample data

## Project Structure

```
backend/
├── src/
│   └── index.ts          # Main server file
├── database/
│   └── mysql_schema.sql  # Database schema
├── scripts/
│   └── setup-database.js # Database setup script
├── package.json
├── tsconfig.json
└── .env
```