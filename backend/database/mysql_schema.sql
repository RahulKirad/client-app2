-- Cottonunique MySQL Database Schema
-- This script creates the complete database schema for the Cottonunique e-commerce platform

-- Create database (run this separately if needed)
-- CREATE DATABASE cottonunique_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE cottonunique_db;

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_is_featured (is_featured),
    INDEX idx_is_active (is_active)
);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    order_type VARCHAR(50),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_email (email)
);

-- Product sample requests (from product listing / detail "Request Sample")
CREATE TABLE IF NOT EXISTS sample_requests (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sample_status (status),
    INDEX idx_sample_created (created_at),
    INDEX idx_sample_product (product_id)
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_username (username)
);

-- Create content_sections table
CREATE TABLE IF NOT EXISTS content_sections (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    section_key VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_section_key (section_key),
    INDEX idx_is_active (is_active)
);

-- No default/demo products inserted. Products are added via the admin panel only.
-- To remove any existing demo products from an older install, run: DELETE FROM products;

-- Create chatbot_settings table (single row for app-wide chatbot control)
CREATE TABLE IF NOT EXISTS chatbot_settings (
    id INT PRIMARY KEY DEFAULT 1,
    is_enabled TINYINT(1) NOT NULL DEFAULT 1,
    custom_instructions TEXT COMMENT 'What the chatbot should respond to / extra rules',
    disallowed_topics TEXT COMMENT 'What the chatbot should NOT respond to (e.g. topics, keywords)',
    welcome_message TEXT COMMENT 'Optional custom welcome message',
    preferred_model VARCHAR(128) NULL COMMENT 'Admin-selected Gemini model ID; NULL = auto',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
);

INSERT IGNORE INTO chatbot_settings (id, is_enabled, welcome_message) VALUES
(1, 1, NULL);

-- SMTP credentials for contact-form email (admin UI); optional, server can also use .env
CREATE TABLE IF NOT EXISTS smtp_settings (
    id INT PRIMARY KEY DEFAULT 1,
    email_user VARCHAR(255) NOT NULL DEFAULT '',
    app_password_ciphertext TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO smtp_settings (id, email_user) VALUES (1, '');

-- Insert default content sections (only if table is empty)
INSERT IGNORE INTO content_sections (section_key, title, content) VALUES
('hero', 'Homepage Hero', '{"headline": "Where intelligent design meets ethical craftsmanship", "subheadline": "Smart. Sustainable. Global.", "cta_primary": "Explore Our Totes", "cta_secondary": "Corporate Solutions"}'),
('highlights', 'Key Highlights', '{"items": ["GOTS-certified cotton", "FSC-compliant packaging", "Export-ready documentation", "Custom branding for corporate gifting"]}'),
('about_mission', 'Our Mission', '{"content": "To deliver premium, sustainable tote bags that meet the highest global standards—ethically sourced, intelligently designed, and export-ready."}'),
('about_story', 'Our Story', '{"content": "Born from a passion for sustainability and global commerce, Cottonunique blends natural materials with modern branding to serve clients across continents."}'),
('certifications', 'Certifications', '{"items": ["GOTS", "FSC", "MSME & export compliance"]}');