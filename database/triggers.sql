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
