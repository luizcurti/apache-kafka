-- Kafka Connectors MySQL Setup Script
-- This script initializes the database for Kafka Connect CDC

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS kafkadb;
USE kafkadb;

-- Create a dedicated Debezium user with minimum required privileges
-- Replace 'debezium_password' with the value of MYSQL_CDC_PASSWORD from your .env
CREATE USER IF NOT EXISTS 'debezium'@'%' IDENTIFIED BY 'debezium_password';
GRANT SELECT, RELOAD, SHOW DATABASES, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'debezium'@'%';
FLUSH PRIVILEGES;

-- Create categories table with proper structure for CDC
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive', 'archived') DEFAULT 'active',
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Insert sample data for testing
INSERT INTO categories (name, description, status, price) VALUES 
('Electronics', 'Electronic devices and gadgets', 'active', 299.99),
('Automotive', 'Cars, motorcycles and automotive parts', 'active', 1999.50),
('Musical Instruments', 'Guitars, pianos and other instruments', 'active', 899.00),
('Books', 'Fiction, non-fiction and educational books', 'active', 29.99),
('Sports', 'Sports equipment and accessories', 'active', 149.99),
('Home & Garden', 'Furniture, tools and garden supplies', 'inactive', 199.99),
('Clothing', 'Fashion and apparel', 'active', 79.99),
('Toys & Games', 'Children toys and board games', 'active', 39.99);

-- Create products table for additional CDC testing
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) UNIQUE,
    price DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    status ENUM('available', 'out_of_stock', 'discontinued') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_category (category_id),
    INDEX idx_sku (sku),
    INDEX idx_status (status)
);

-- Insert sample products
INSERT INTO products (category_id, name, description, sku, price, stock_quantity, status) VALUES
(1, 'Smartphone X1', 'Latest smartphone with advanced features', 'PHONE-X1-001', 699.99, 50, 'available'),
(1, 'Wireless Headphones', 'High-quality wireless headphones', 'HEAD-WL-002', 199.99, 25, 'available'),
(2, 'Car Battery', '12V automotive battery', 'BATT-12V-003', 89.99, 10, 'available'),
(3, 'Acoustic Guitar', 'Professional acoustic guitar', 'GUITAR-AC-004', 399.99, 5, 'available'),
(4, 'Programming Book', 'Learn programming fundamentals', 'BOOK-PROG-005', 49.99, 100, 'available');

-- Create orders table for complex CDC scenarios
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_email VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_date TIMESTAMP NULL,
    delivered_date TIMESTAMP NULL,
    INDEX idx_customer (customer_email),
    INDEX idx_status (status),
    INDEX idx_order_date (order_date)
);

-- Create order_items table for one-to-many relationships
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
);

-- Insert sample orders and order items
INSERT INTO orders (customer_email, total_amount, status) VALUES
('john.doe@example.com', 899.98, 'processing'),
('jane.smith@example.com', 199.99, 'shipped'),
('bob.johnson@example.com', 449.98, 'delivered');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 699.99),  -- Smartphone
(1, 2, 1, 199.99),  -- Headphones
(2, 2, 1, 199.99),  -- Headphones only
(3, 3, 1, 89.99),   -- Battery
(3, 4, 1, 399.99),  -- Guitar
(3, 5, 2, 49.99);   -- 2 Books

-- Verify the setup
SELECT 'Categories' as table_name, COUNT(*) as record_count FROM categories
UNION ALL
SELECT 'Products' as table_name, COUNT(*) as record_count FROM products
UNION ALL
SELECT 'Orders' as table_name, COUNT(*) as record_count FROM orders
UNION ALL
SELECT 'Order Items' as table_name, COUNT(*) as record_count FROM order_items;

-- Show table structures
SHOW TABLES;

-- Enable binary logging (should already be configured in docker-compose)
-- SHOW VARIABLES LIKE 'log_bin';
-- SHOW VARIABLES LIKE 'binlog_format';

COMMIT;