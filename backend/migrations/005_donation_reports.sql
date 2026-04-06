-- Donation Reports Table
CREATE TABLE IF NOT EXISTS donation_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('inappropriate', 'expired', 'misleading', 'unavailable', 'other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_donation_reports_donation ON donation_reports(donation_id);
CREATE INDEX IF NOT EXISTS idx_donation_reports_status ON donation_reports(status);
CREATE INDEX IF NOT EXISTS idx_donation_reports_reporter ON donation_reports(reporter_id);