# Product Publish/Unpublish System Design

## Overview

This design document outlines the implementation of a product visibility management system that allows administrators to control which products appear on the public website through a publish/unpublish mechanism. The system integrates with the existing MySQL database and React admin interface.

## Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Panel   │    │   Backend API   │    │ Public Website  │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │   Product   │ │◄──►│ │   Product   │ │◄──►│ │  Products   │ │
│ │ Management  │ │    │ │   Routes    │ │    │ │    Page     │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │  Publish    │ │    │ │  Database   │ │    │ │  Homepage   │ │
│ │  Controls   │ │    │ │   Layer     │ │    │ │  Carousel   │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **Admin Creates/Edits Product** → Sets publish status → Saves to database
2. **Database Update** → Triggers API response updates
3. **Public Website** → Fetches only published products → Displays to users
4. **Real-time Updates** → Status changes reflect immediately on public site

## Components and Interfaces

### Database Schema Changes

#### Products Table Update
```sql
-- Add is_published column to existing products table
ALTER TABLE products 
ADD COLUMN is_published BOOLEAN DEFAULT FALSE AFTER is_active;

-- Add index for performance
CREATE INDEX idx_is_published ON products(is_published);

-- Update existing products (set featured products as published by default)
UPDATE products SET is_published = TRUE WHERE is_featured = TRUE;
```

#### Updated Products Table Structure
```sql
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    material VARCHAR(255) DEFAULT '100% GOTS-certified cotton',
    print_type VARCHAR(255) DEFAULT 'Water-based inks',
    packaging VARCHAR(255) DEFAULT 'FSC-certified hangtags and labels',
    moq VARCHAR(255) DEFAULT 'Flexible for pilot programs',
    price DECIMAL(10,2) DEFAULT 0.00,
    image_url TEXT,
    gallery_images JSON,
    specifications JSON,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,  -- NEW FIELD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_is_featured (is_featured),
    INDEX idx_is_active (is_active),
    INDEX idx_is_published (is_published)  -- NEW INDEX
);
```

### Backend API Updates

#### Modified API Endpoints

**Public Endpoints (Filtered)**
```typescript
// GET /api/products - Only published products
app.get('/api/products', async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM products WHERE is_active = TRUE AND is_published = TRUE ORDER BY is_featured DESC, created_at DESC'
  );
  res.json(rows);
});

// GET /api/products/featured - Only published AND featured products
app.get('/api/products/featured', async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM products WHERE is_active = TRUE AND is_published = TRUE AND is_featured = TRUE ORDER BY created_at DESC'
  );
  res.json(rows);
});
```

**Admin Endpoints (All Products)**
```typescript
// GET /api/admin/products - All products regardless of publish status
app.get('/api/admin/products', authenticateToken, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM products ORDER BY created_at DESC'
  );
  res.json(rows);
});

// PUT /api/admin/products/:id/publish - Toggle publish status
app.put('/api/admin/products/:id/publish', authenticateToken, async (req, res) => {
  const { is_published } = req.body;
  await pool.execute(
    'UPDATE products SET is_published = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [is_published, req.params.id]
  );
  res.json({ message: 'Product publish status updated successfully' });
});
```

### Frontend Components Design

#### Admin Product Form Enhancement
```typescript
interface ProductFormData {
  name: string;
  category: string;
  description: string;
  material: string;
  print_type: string;
  packaging: string;
  moq: string;
  price: number;
  specifications: string;
  is_featured: boolean;
  is_published: boolean;  // NEW FIELD
}
```

#### Publish Status Toggle Component
```typescript
interface PublishToggleProps {
  isPublished: boolean;
  onToggle: (published: boolean) => void;
  disabled?: boolean;
}

const PublishToggle: React.FC<PublishToggleProps> = ({ 
  isPublished, 
  onToggle, 
  disabled 
}) => {
  return (
    <div className="flex items-center space-x-3">
      <label className="text-sm font-medium text-slate-700">
        Publish Status
      </label>
      <button
        type="button"
        onClick={() => onToggle(!isPublished)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isPublished ? 'bg-emerald-600' : 'bg-slate-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isPublished ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-sm font-medium ${
        isPublished ? 'text-emerald-600' : 'text-slate-500'
      }`}>
        {isPublished ? 'Published' : 'Unpublished'}
      </span>
    </div>
  );
};
```

#### Product Card Status Indicators
```typescript
const ProductStatusBadge: React.FC<{ isPublished: boolean }> = ({ isPublished }) => {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
      isPublished 
        ? 'bg-emerald-100 text-emerald-800' 
        : 'bg-slate-100 text-slate-600'
    }`}>
      {isPublished ? '✓ Published' : '○ Unpublished'}
    </span>
  );
};
```

## Data Models

### Product Interface Update
```typescript
interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  material: string;
  print_type: string;
  packaging: string;
  moq: string;
  price: number;
  image_url: string;
  gallery_images: string[];
  specifications: Record<string, any>;
  is_featured: boolean;
  is_active: boolean;
  is_published: boolean;  // NEW FIELD
  created_at: string;
  updated_at: string;
}
```

### API Response Models
```typescript
// Admin Product Response (includes all fields)
interface AdminProductResponse extends Product {
  publish_status: 'published' | 'unpublished';
}

// Public Product Response (only published products)
interface PublicProductResponse extends Omit<Product, 'is_published'> {
  // is_published field omitted as all returned products are published
}
```

## Error Handling

### Validation Rules
1. **Publish Status Validation**: Ensure is_published is boolean
2. **Featured Product Logic**: Warn if unpublishing a featured product
3. **Database Constraints**: Handle foreign key constraints gracefully
4. **Concurrent Updates**: Implement optimistic locking for status changes

### Error Scenarios
```typescript
// Handle publish status update errors
try {
  await updateProductPublishStatus(productId, isPublished);
} catch (error) {
  if (error.code === 'PRODUCT_NOT_FOUND') {
    showError('Product not found');
  } else if (error.code === 'CONCURRENT_UPDATE') {
    showError('Product was updated by another user. Please refresh and try again.');
  } else {
    showError('Failed to update publish status. Please try again.');
  }
}
```

## Testing Strategy

### Unit Tests
1. **Database Operations**: Test publish status CRUD operations
2. **API Endpoints**: Test filtering logic for public vs admin endpoints
3. **Component Logic**: Test publish toggle functionality
4. **Validation**: Test input validation and error handling

### Integration Tests
1. **End-to-End Workflow**: Create product → Set publish status → Verify public visibility
2. **Real-time Updates**: Test immediate website updates when status changes
3. **Bulk Operations**: Test bulk publish/unpublish functionality
4. **Permission Testing**: Verify admin-only access to publish controls

### Test Scenarios
```typescript
describe('Product Publish System', () => {
  test('should only show published products on public website', async () => {
    // Create published and unpublished products
    // Fetch public products API
    // Verify only published products returned
  });

  test('should update homepage carousel when publish status changes', async () => {
    // Create featured product
    // Unpublish product
    // Verify carousel no longer shows product
  });

  test('should provide admin access to all products', async () => {
    // Create mix of published/unpublished products
    // Fetch admin products API
    // Verify all products returned with status
  });
});
```

## Performance Considerations

### Database Optimization
1. **Indexing**: Add index on is_published column for fast filtering
2. **Query Optimization**: Use compound indexes for common query patterns
3. **Caching**: Implement Redis caching for frequently accessed published products
4. **Pagination**: Implement pagination for large product catalogs

### Frontend Optimization
1. **State Management**: Use React Context for publish status state
2. **Optimistic Updates**: Update UI immediately, rollback on error
3. **Lazy Loading**: Load product images only when needed
4. **Debouncing**: Debounce rapid publish status changes

## Security Considerations

### Access Control
1. **Authentication**: Require admin authentication for publish controls
2. **Authorization**: Verify admin permissions before allowing status changes
3. **Input Validation**: Sanitize all inputs to prevent injection attacks
4. **Rate Limiting**: Limit publish status change frequency per user

### Data Protection
1. **Audit Logging**: Log all publish status changes with user and timestamp
2. **Backup Strategy**: Ensure publish status included in database backups
3. **Recovery Plan**: Ability to restore previous publish states if needed

This design provides a comprehensive foundation for implementing the product publish/unpublish system with proper separation of concerns, robust error handling, and optimal performance.