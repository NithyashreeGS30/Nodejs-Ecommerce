-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT 0,
    profile_picture_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    isActive INTEGER DEFAULT 1,
    reactivation_code TEXT,
    two_factor_enabled BOOLEAN DEFAULT 0,
    two_factor_method TEXT,
    two_factor_secret TEXT,
    backup_codes TEXT
);

-- User Tokens table
CREATE TABLE IF NOT EXISTS user_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Consultants table
CREATE TABLE IF NOT EXISTS consultants (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expertise TEXT NOT NULL,
    languages TEXT,
    hourly_rate DECIMAL(10,2),
    isActive BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Consultation Types table
CREATE TABLE IF NOT EXISTS consultation_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Consultations table
CREATE TABLE IF NOT EXISTS consultations (
    id TEXT PRIMARY KEY,
    consultant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    consultation_type_id TEXT NOT NULL,
    status TEXT NOT NULL,
    scheduled_at DATETIME NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultant_id) REFERENCES consultants(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (consultation_type_id) REFERENCES consultation_types(id)
);

-- Consultant Availability table
CREATE TABLE IF NOT EXISTS consultant_availability (
    id TEXT PRIMARY KEY,
    consultant_id TEXT NOT NULL,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultant_id) REFERENCES consultants(id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    consultation_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultation_id) REFERENCES consultations(id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Notification Preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    email_enabled BOOLEAN DEFAULT 1,
    push_enabled BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Email Preferences table
CREATE TABLE IF NOT EXISTS email_preferences (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    marketing_emails BOOLEAN DEFAULT 1,
    newsletter BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    consultant_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (consultant_id) REFERENCES consultants(id)
);

-- Create triggers for updating timestamps
CREATE TRIGGER IF NOT EXISTS update_user_timestamp 
    AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_consultant_timestamp 
    AFTER UPDATE ON consultants
BEGIN
    UPDATE consultants SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_consultation_timestamp 
    AFTER UPDATE ON consultations
BEGIN
    UPDATE consultations SET updated_at = datetime('now') WHERE id = NEW.id;
END;