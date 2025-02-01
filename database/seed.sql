-- ======================
-- 1) Insert dummy Users
-- ======================
INSERT INTO users (
    id,
    name,
    email,
    phone,
    password,
    email_verified,
    isActive
) VALUES
('u1', 'Dr. Sarah Johnson', 'sarah.johnson@example.com', '1111111111', '$2a$10$6m/CLxm9kQWR.wqUCFhiYOdjWbEYb4.QoaEOgB5KgXaH3W.IFy7Hy', 1, 1),
('u2', 'Dr. Michael Chen', 'michael.chen@example.com', '2222222222', '$2a$10$6m/CLxm9kQWR.wqUCFhiYOdjWbEYb4.QoaEOgB5KgXaH3W.IFy7Hy', 1, 1),
('u3', 'Dr. Maria Garcia', 'maria.garcia@example.com', '3333333333', '$2a$10$6m/CLxm9kQWR.wqUCFhiYOdjWbEYb4.QoaEOgB5KgXaH3W.IFy7Hy', 1, 1),
('u4', 'Dr. James Wilson', 'james.wilson@example.com', '4444444444', '$2a$10$6m/CLxm9kQWR.wqUCFhiYOdjWbEYb4.QoaEOgB5KgXaH3W.IFy7Hy', 1, 1),
('u5', 'Test User', 'test@example.com', '1234567890', '$2a$10$3hdD28pUPG.iPCu79wkbveAHex2QcGSEyHhMkEdyQQrGYu84cMENu', 1, 1);

-- ======================================
-- 2) Insert dummy Consultants
-- ======================================
INSERT INTO consultants (
    id,
    user_id,
    expertise,
    languages,
    hourly_rate,
    isActive
) VALUES
('c1', 'u1', 'Clinical Psychology, Anxiety, Depression', 'English, French', 150.00, 1),
('c2', 'u2', 'Relationship Counseling, Family Therapy, Marriage Counseling', 'English, Mandarin, Cantonese', 130.00, 1),
('c3', 'u3', 'Child Psychology, ADHD, Learning Disabilities', 'English, Spanish', 140.00, 1),
('c4', 'u4', 'Cognitive Behavioral Therapy, Trauma, PTSD', 'English', 160.00, 1);

-- ===========================================
-- 3) Insert dummy Consultation Types
-- ===========================================
INSERT INTO consultation_types (
    id,
    name,
    description,
    duration,
    price
) VALUES
('ct1', 'Initial Consultation', 'First-time consultation to assess needs and develop treatment plan', 60, 150.00),
('ct2', 'Follow-up Session', 'Regular follow-up therapy session', 45, 120.00),
('ct3', 'Couples Therapy', 'Intensive couples counseling session', 90, 200.00),
('ct4', 'Child Assessment', 'Comprehensive child psychological assessment', 60, 140.00),
('ct5', 'PTSD Treatment', 'Specialized PTSD treatment session', 60, 160.00);

-- ======================================
-- 4) Insert dummy Consultations
-- ======================================
-- Using only "status" and "scheduled_at" from your updated schema
INSERT INTO consultations (
    id,
    consultant_id,
    user_id,
    consultation_type_id,
    status,
    scheduled_at
) VALUES
('cons1', 'c1', 'u2', 'ct1', 'scheduled', '2025-02-01 10:00:00'),
('cons2', 'c1', 'u3', 'ct2', 'scheduled', '2025-02-02 14:00:00'),
('cons3', 'c2', 'u1', 'ct3', 'scheduled', '2025-02-03 15:00:00');

-- =================================================
-- 5) Insert dummy Consultant Availability
-- =================================================
INSERT INTO consultant_availability (
    id,
    consultant_id,
    day_of_week,
    start_time,
    end_time
) VALUES
('ca1', 'c1', 1, '09:00', '17:00'), 
('ca2', 'c1', 2, '09:00', '17:00'), 
('ca3', 'c2', 1, '10:00', '18:00'),
('ca4', 'c3', 1, '08:00', '16:00'),
('ca5', 'c4', 1, '11:00', '19:00');

-- ================================
-- 6) Insert dummy Reviews
-- ================================
INSERT INTO reviews (
    id,
    consultation_id,
    rating,
    comment
) VALUES
('r1', 'cons1', 5, 'Excellent session, very helpful!'),
('r2', 'cons2', 4, 'Great insights and practical advice'),
('r3', 'cons3', 5, 'Transformative experience');

-- ====================================
-- 7) Insert dummy Notifications
-- ====================================
INSERT INTO notifications (
    id,
    user_id,
    type,
    message,
    is_read
) VALUES
('n1', 'u1', 'welcome', 'Welcome to our platform, Dr. Sarah Johnson!', 0),
('n2', 'u2', 'reminder', 'Your upcoming consultation is scheduled for 2025-02-01.', 0),
('n3', 'u3', 'follow-up', 'How was your last consultation? Let us know.', 0);

-- ==============================================
-- 8) Insert dummy Notification Preferences
-- ==============================================
INSERT INTO notification_preferences (
    id,
    user_id,
    type,
    email_enabled,
    push_enabled
) VALUES
('np1', 'u1', 'appointment_reminder', 1, 1),
('np2', 'u2', 'newsletter', 1, 0),
('np3', 'u3', 'promotions', 0, 1);

-- ========================================
-- 9) Insert dummy Email Preferences
-- ========================================
INSERT INTO email_preferences (
    id,
    user_id,
    marketing_emails,
    newsletter
) VALUES
('ep1', 'u1', 1, 1),
('ep2', 'u2', 0, 1),
('ep3', 'u3', 1, 0);

-- ================================
-- 10) Insert dummy Favorites
-- ================================
INSERT INTO favorites (
    id,
    user_id,
    consultant_id
) VALUES
('f1', 'u5', 'c1'),
('f2', 'u5', 'c2');
