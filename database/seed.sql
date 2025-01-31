-- Insert test users
INSERT INTO Users (id, name, email, phone, password, isEmailVerified) VALUES
('u1', 'Dr. Sarah Johnson', 'sarah.johnson@example.com', '1111111111', '$2a$10$6m/CLxm9kQWR.wqUCFhiYOdjWbEYb4.QoaEOgB5KgXaH3W.IFy7Hy', TRUE),
('u2', 'Dr. Michael Chen', 'michael.chen@example.com', '2222222222', '$2a$10$6m/CLxm9kQWR.wqUCFhiYOdjWbEYb4.QoaEOgB5KgXaH3W.IFy7Hy', TRUE),
('u3', 'Dr. Maria Garcia', 'maria.garcia@example.com', '3333333333', '$2a$10$6m/CLxm9kQWR.wqUCFhiYOdjWbEYb4.QoaEOgB5KgXaH3W.IFy7Hy', TRUE),
('u4', 'Dr. James Wilson', 'james.wilson@example.com', '4444444444', '$2a$10$6m/CLxm9kQWR.wqUCFhiYOdjWbEYb4.QoaEOgB5KgXaH3W.IFy7Hy', TRUE),
('u5', 'Test User', 'test@example.com', '1234567890', '$2a$10$3hdD28pUPG.iPCu79wkbveAHex2QcGSEyHhMkEdyQQrGYu84cMENu', TRUE);

-- Insert consultants with specific expertise and languages
INSERT INTO Consultants (id, userId, expertise, languages, bio, experience, hourlyRate, availability, isAvailable) VALUES
('c1', 'u1', 
 '["Clinical Psychology", "Anxiety", "Depression"]',
 '["English", "French"]',
 'Experienced clinical psychologist specializing in anxiety and depression treatment.',
 15,
 150.00,
 '{"weeklySchedule": {"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}}}',
 TRUE
),
('c2', 'u2',
 '["Relationship Counseling", "Family Therapy", "Marriage Counseling"]',
 '["English", "Mandarin", "Cantonese"]',
 'Family and relationship counselor with expertise in cross-cultural relationships.',
 12,
 130.00,
 '{"weeklySchedule": {"monday": {"start": "10:00", "end": "18:00"}, "tuesday": {"start": "10:00", "end": "18:00"}, "wednesday": {"start": "10:00", "end": "18:00"}, "thursday": {"start": "10:00", "end": "18:00"}, "friday": {"start": "10:00", "end": "18:00"}}}',
 TRUE
),
('c3', 'u3',
 '["Child Psychology", "ADHD", "Learning Disabilities"]',
 '["English", "Spanish"]',
 'Child psychologist specializing in ADHD and learning disabilities.',
 10,
 140.00,
 '{"weeklySchedule": {"monday": {"start": "08:00", "end": "16:00"}, "tuesday": {"start": "08:00", "end": "16:00"}, "wednesday": {"start": "08:00", "end": "16:00"}, "thursday": {"start": "08:00", "end": "16:00"}, "friday": {"start": "08:00", "end": "16:00"}}}',
 TRUE
),
('c4', 'u4',
 '["Cognitive Behavioral Therapy", "Trauma", "PTSD"]',
 '["English"]',
 'Trauma specialist with focus on PTSD and cognitive behavioral therapy.',
 20,
 160.00,
 '{"weeklySchedule": {"monday": {"start": "11:00", "end": "19:00"}, "tuesday": {"start": "11:00", "end": "19:00"}, "wednesday": {"start": "11:00", "end": "19:00"}, "thursday": {"start": "11:00", "end": "19:00"}, "friday": {"start": "11:00", "end": "19:00"}}}',
 TRUE
);

-- Insert consultation types
INSERT INTO ConsultationTypes (id, consultantId, name, sessionType, duration, price, description) VALUES
('ct1', 'c1', 'Initial Consultation', 'video', 60, 150.00, 'First-time consultation to assess needs and develop treatment plan'),
('ct2', 'c1', 'Follow-up Session', 'video', 45, 120.00, 'Regular follow-up therapy session'),
('ct3', 'c2', 'Couples Therapy', 'video', 90, 200.00, 'Intensive couples counseling session'),
('ct4', 'c3', 'Child Assessment', 'video', 60, 140.00, 'Comprehensive child psychological assessment'),
('ct5', 'c4', 'PTSD Treatment', 'video', 60, 160.00, 'Specialized PTSD treatment session');

-- Insert some test consultations (both upcoming and past)
INSERT INTO Consultations (id, userId, consultantId, consultationTypeId, startTime, endTime, status, paymentStatus, amount) VALUES
('cons1', 'u2', 'c1', 'ct1', '2025-02-01 10:00:00', '2025-02-01 11:00:00', 'scheduled', 'paid', 150.00),
('cons2', 'u3', 'c1', 'ct2', '2025-02-02 14:00:00', '2025-02-02 15:00:00', 'scheduled', 'paid', 120.00),
('cons3', 'u1', 'c2', 'ct3', '2025-02-03 15:00:00', '2025-02-03 16:30:00', 'scheduled', 'paid', 200.00);

-- Insert some reviews
INSERT INTO Reviews (id, consultationId, rating, review, isPublic) VALUES
('r1', 'cons1', 5, 'Excellent session, very helpful!', TRUE),
('r2', 'cons2', 4, 'Great insights and practical advice', TRUE),
('r3', 'cons3', 5, 'Transformative experience', TRUE);
