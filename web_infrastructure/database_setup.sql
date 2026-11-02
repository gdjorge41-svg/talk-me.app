-- Talk-me v70 Sovereign - Database Schema
-- Ejecutado en: Aruba MySQL (31.11.39.205)
-- Fecha: 2026-06-04

CREATE TABLE IF NOT EXISTS tm_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) DEFAULT NULL,
    last_name VARCHAR(100) DEFAULT NULL,
    company_name VARCHAR(150) DEFAULT NULL,
    phone VARCHAR(45) DEFAULT NULL,
    billing_address TEXT DEFAULT NULL,
    country VARCHAR(100) DEFAULT NULL,
    preferred_lang VARCHAR(10) DEFAULT 'es',
    password_reset_token VARCHAR(100) DEFAULT NULL,
    password_reset_expires DATETIME DEFAULT NULL,
    deleted_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tm_licenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    license_key VARCHAR(100) UNIQUE NOT NULL,
    status ENUM('active', 'expired', 'trial', 'blocked', 'revoked') DEFAULT 'active',
    expires_at DATETIME DEFAULT NULL, -- Modificado a DEFAULT NULL para permitir vitalicias sin crash
    stripe_sub_id VARCHAR(255),
    payment_mode ENUM('one_time', 'rent_to_own') NOT NULL DEFAULT 'one_time',
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_paid DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    rto_payments_count INT NOT NULL DEFAULT 0,
    rto_strikes INT NOT NULL DEFAULT 0,
    rto_last_strike_date DATE DEFAULT NULL,
    one_time_strikes INT NOT NULL DEFAULT 0,
    one_time_last_strike_date DATE DEFAULT NULL,
    last_online_validation DATETIME DEFAULT NULL,
    subscription_status ENUM('active', 'past_due', 'canceled', 'complete') NOT NULL DEFAULT 'active',
    license_version INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    device_limit INT DEFAULT 1,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'eur',
    FOREIGN KEY (user_id) REFERENCES tm_users(id) ON DELETE CASCADE,
    INDEX idx_stripe_sub (stripe_sub_id),
    INDEX idx_license_key (license_key)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tm_hw_bindings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    license_id INT,
    hw_fingerprint VARCHAR(255) UNIQUE NOT NULL,
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (license_id) REFERENCES tm_licenses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tm_session_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hw_fingerprint VARCHAR(255),
    duration_mins INT,
    msg_count INT,
    trigger_count INT,
    session_data LONGTEXT, -- Modificado de JSON a LONGTEXT para compatibilidad con MySQL antiguo (<5.7.8)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_hw_fingerprint (hw_fingerprint),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tm_processed_stripe_events (
    event_id VARCHAR(255) PRIMARY KEY,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tm_security_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES tm_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tm_email_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body LONGTEXT NOT NULL,
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tm_hw_trials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hw_fingerprint VARCHAR(255) UNIQUE NOT NULL,
    user_id INT,
    license_key VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES tm_users(id) ON DELETE SET NULL,
    INDEX idx_hw_fingerprint (hw_fingerprint)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tm_user_lifecycle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    event_type ENUM('REGISTRATION', 'DELETION', 'RE_REGISTRATION') NOT NULL,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES tm_users(id) ON DELETE CASCADE,
    INDEX idx_user_lifecycle_occurred (occurred_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tm_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    secure_token VARCHAR(36) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    license_id INT NOT NULL,
    stripe_charge_id VARCHAR(255) NULL,
    company_name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(50) NOT NULL,
    billing_address TEXT NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 21.00,
    total_amount DECIMAL(10,2) NOT NULL,
    pdf_path VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_token (secure_token),
    INDEX idx_num (invoice_number),
    FOREIGN KEY (user_id) REFERENCES tm_users(id) ON DELETE RESTRICT,
    FOREIGN KEY (license_id) REFERENCES tm_licenses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

