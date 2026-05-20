# Migration from Supabase to MySQL

This guide outlines the complete migration from Supabase to MySQL for the Cottonunique application.

## What Was Changed

### 1. Database Migration
- ✅ **Removed**: Supabase configuration and dependencies
- ✅ **Added**: MySQL database schema (`database/mysql_schema.sql`)
- ✅ **Converted**: PostgreSQL-specific syntax to MySQL-compatible format
- ✅ **Updated**: UUID generation to use MySQL's `UUID()` function
- ✅ **Added**: Proper indexes for performance optimization

### 2. Backend API
- ✅ **Created**: Express.js REST API server (`server/index.ts`)
- ✅ **Added**: MySQL connection pool with mysql2 driver
- ✅ **Implemented**: All necessary endpoints:
  - `GET /api/products` - Get all products
  - `GET /api/products/featured` - Get featured products
  - `GET /api/products/:id` - Get single product
  - `POST /api/inquiries` - Submit inquiry
  - `GET /api/content/:sectionKey` - Get content sections
  - `GET /api/health` - Health check

### 3. Frontend Updates
- ✅ **Removed**: `@supabase/supabase-js` dependency
- ✅ **Removed**: `src/lib/supabase.ts` file
- ✅ **Created**: `src/lib/api.ts` with REST API client
- ✅ **Updated**: Products component to use new API
- ✅ **Updated**: Contact component to use new API
- ✅ **Maintained**: All existing functionality and UI

### 4. Configuration
- ✅ **Updated**: Environment variables for MySQL connection
- ✅ **Added**: Development scripts for running both frontend and backend
- ✅ **Created**: Database setup script for easy initialization

## Quick Setup

1. **Install MySQL** (if not already installed)
2. **Update environment variables** in `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=cottonunique_db
   DB_USER=root
   DB_PASSWORD=your_password_here
   VITE_API_URL=http://localhost:3001/api
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Setup database**:
   ```bash
   npm run setup-db
   ```

5. **Run the application**:
   ```bash
   npm run dev:full
   ```

## Data Migration

The database schema includes all the same data that was in Supabase:
- **Products**: 4 sample products with specifications and images
- **Content Sections**: Homepage content (hero, highlights, about, etc.)
- **Inquiries**: Table ready for contact form submissions

## API Compatibility

The new MySQL API maintains the same data structure as the original Supabase implementation:
- Same field names and types
- Same JSON structure for specifications and gallery images
- Same filtering and sorting behavior
- Same response formats

## Performance Improvements

- **Connection Pooling**: MySQL connection pool for better performance
- **Indexes**: Added database indexes for frequently queried fields
- **Error Handling**: Improved error handling and logging
- **Type Safety**: Full TypeScript support throughout the stack

## Rollback Plan

If you need to rollback to Supabase:
1. Restore the `supabase/` folder from backup
2. Reinstall `@supabase/supabase-js`
3. Restore the original `src/lib/supabase.ts` file
4. Update the component imports back to Supabase

## Next Steps

1. **Production Setup**: Configure MySQL for production environment
2. **SSL/TLS**: Enable secure connections for production
3. **Backup Strategy**: Implement regular database backups
4. **Monitoring**: Add database performance monitoring
5. **Scaling**: Consider read replicas for high-traffic scenarios