-- Sample request leads (products page / carousel / detail "Request Sample")
-- Run once on existing databases, or rely on ensureSampleRequestsTable() on server boot.

CREATE TABLE IF NOT EXISTS sample_requests (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255) DEFAULT NULL,
  email VARCHAR(255) NOT NULL,
  region VARCHAR(100) DEFAULT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sample_status (status),
  INDEX idx_sample_created (created_at),
  INDEX idx_sample_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
