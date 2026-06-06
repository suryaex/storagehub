-- ─────────────────────────────────────────────────────────────
-- StorageHub — baseline seed data (idempotent)
-- ─────────────────────────────────────────────────────────────
USE storagehub;

INSERT INTO system_settings (setting_key, setting_value, value_type) VALUES
    ('default_user_quota', '10737418240', 'number'),
    ('max_upload_size', '53687091200', 'number'),
    ('trash_retention_days', '30', 'number'),
    ('share_link_expiry_default', '', 'string'),
    ('upload_chunk_size', '8388608', 'number')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

INSERT INTO quota_policies (name, quota_bytes, applies_to_role, is_default) VALUES
    ('Default User Quota', 10737418240, 'user', TRUE),
    ('Admin Override', 107374182400, 'admin', FALSE)
ON DUPLICATE KEY UPDATE name = name;
