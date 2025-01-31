-- Users table
CREATE TABLE IF NOT EXISTS Users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    password TEXT NOT NULL,
    profilePicture TEXT,
    isEmailVerified BOOLEAN DEFAULT FALSE,
    isPhoneVerified BOOLEAN DEFAULT FALSE,
    twoFactorEnabled BOOLEAN DEFAULT FALSE,
    twoFactorMethod TEXT CHECK (twoFactorMethod IN ('email', 'sms', 'authenticator')),
    twoFactorSecret TEXT,
    isActive BOOLEAN DEFAULT TRUE,
    lastLoginAt DATETIME,
    emailPreferences JSON,
    notificationPreferences JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Consultants table
CREATE TABLE IF NOT EXISTS Consultants (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    expertise JSON NOT NULL,
    languages JSON NOT NULL,
    bio TEXT,
    experience INTEGER,
    rating FLOAT DEFAULT 0,
    totalRatings INTEGER DEFAULT 0,
    hourlyRate DECIMAL(10,2) NOT NULL,
    availability JSON,
    isAvailable BOOLEAN DEFAULT TRUE,
    filters JSON,
    verificationStatus TEXT CHECK (verificationStatus IN ('pending', 'verified', 'rejected')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- ConsultantVerification table
CREATE TABLE IF NOT EXISTS ConsultantVerification (
    id TEXT PRIMARY KEY,
    consultantId TEXT NOT NULL,
    documentType TEXT NOT NULL,
    documentUrl TEXT NOT NULL,
    verificationStatus TEXT CHECK (verificationStatus IN ('pending', 'verified', 'rejected')),
    verificationNotes TEXT,
    verifiedAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultantId) REFERENCES Consultants(id)
);

-- ScheduleHistory table
CREATE TABLE IF NOT EXISTS ScheduleHistory (
    id TEXT PRIMARY KEY,
    consultantId TEXT NOT NULL,
    oldAvailability JSON,
    newAvailability JSON,
    changeReason TEXT,
    effectiveFrom DATETIME NOT NULL,
    effectiveTo DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultantId) REFERENCES Consultants(id)
);

-- ConsultationTypes table
CREATE TABLE IF NOT EXISTS ConsultationTypes (
    id TEXT PRIMARY KEY,
    consultantId TEXT NOT NULL,
    name TEXT NOT NULL,
    sessionType TEXT NOT NULL,
    duration INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    cancellationPolicy JSON,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultantId) REFERENCES Consultants(id)
);

-- Consultations table
CREATE TABLE IF NOT EXISTS Consultations (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    consultantId TEXT NOT NULL,
    consultationTypeId TEXT NOT NULL,
    startTime DATETIME NOT NULL,
    endTime DATETIME NOT NULL,
    status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    paymentStatus TEXT CHECK (paymentStatus IN ('pending', 'paid', 'refunded', 'failed')),
    amount DECIMAL(10,2) NOT NULL,
    paymentId TEXT,
    cancellationReason TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (consultantId) REFERENCES Consultants(id),
    FOREIGN KEY (consultationTypeId) REFERENCES ConsultationTypes(id)
);

-- SessionDetails table
CREATE TABLE IF NOT EXISTS SessionDetails (
    id TEXT PRIMARY KEY,
    consultationId TEXT NOT NULL,
    videoUrl TEXT,
    chatUrl TEXT,
    callUrl TEXT,
    recordingUrl TEXT,
    platformDetails JSON,
    joinedAt DATETIME,
    endedAt DATETIME,
    sessionMetrics JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultationId) REFERENCES Consultations(id)
);

-- RefundDetails table
CREATE TABLE IF NOT EXISTS RefundDetails (
    id TEXT PRIMARY KEY,
    consultationId TEXT NOT NULL,
    refundAmount DECIMAL(10,2) NOT NULL,
    refundStatus TEXT CHECK (refundStatus IN ('pending', 'processed', 'failed')),
    refundId TEXT,
    refundReason TEXT,
    processedAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultationId) REFERENCES Consultations(id)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS Reviews (
    id TEXT PRIMARY KEY,
    consultationId TEXT NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    isPublic BOOLEAN DEFAULT TRUE,
    isModerated BOOLEAN DEFAULT FALSE,
    moderationNotes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultationId) REFERENCES Consultations(id)
);

-- ConsultationNotes table
CREATE TABLE IF NOT EXISTS ConsultationNotes (
    id TEXT PRIMARY KEY,
    consultationId TEXT NOT NULL,
    userId TEXT NOT NULL,
    notes TEXT NOT NULL,
    isPrivate BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultationId) REFERENCES Consultations(id),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS Notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('appointment', 'reminder', 'system', 'payment')),
    isRead BOOLEAN DEFAULT FALSE,
    metadata JSON,
    scheduledFor DATETIME,
    sentAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- FavoriteConsultants table
CREATE TABLE IF NOT EXISTS FavoriteConsultants (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    consultantId TEXT NOT NULL,
    notifyAvailability BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (consultantId) REFERENCES Consultants(id),
    UNIQUE(userId, consultantId)
);

-- AdminAnalytics table
CREATE TABLE IF NOT EXISTS AdminAnalytics (
    id TEXT PRIMARY KEY,
    consultationId TEXT NOT NULL,
    totalConsultations INTEGER DEFAULT 0,
    totalRevenue DECIMAL(10,2) DEFAULT 0,
    activeUsers INTEGER DEFAULT 0,
    activeConsultants INTEGER DEFAULT 0,
    averageRating FLOAT DEFAULT 0,
    consultantPerformance JSON,
    userEngagement JSON,
    revenueMetrics JSON,
    sessionMetrics JSON,
    periodStart DATETIME,
    periodEnd DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultationId) REFERENCES Consultations(id)
);

-- Create triggers for updating timestamps
CREATE TRIGGER IF NOT EXISTS update_user_timestamp
AFTER UPDATE ON Users
BEGIN
    UPDATE Users SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_consultant_timestamp
AFTER UPDATE ON Consultants
BEGIN
    UPDATE Consultants SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_consultation_timestamp
AFTER UPDATE ON Consultations
BEGIN
    UPDATE Consultations SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
