-- Migration 006e: Migrate existing user data

-- Map existing 'role' column to new 'role_id' foreign key
UPDATE users SET role_id = (
  SELECT id FROM roles WHERE
    (users.role = 'admin' AND roles.name = 'Admin') OR
    (users.role = 'manager' AND roles.name = 'Manager') OR
    (users.role = 'user' AND roles.name = 'Employee')
)
WHERE role_id IS NULL;

-- Set default values for new required fields
UPDATE users SET
  password_reset_required = 0,
  failed_login_count = 0,
  password_changed_at = created_at
WHERE password_reset_required IS NULL OR failed_login_count IS NULL OR password_changed_at IS NULL;
