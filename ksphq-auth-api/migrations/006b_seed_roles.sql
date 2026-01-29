-- Migration 006b: Seed default roles

INSERT INTO roles (name, level, description, permissions, is_system_role) VALUES
  ('Admin', 100, 'Full system access', '{"all": true, "workforce": true, "docks": true, "projects": true, "tickets": true, "user_management": "full"}', 1),
  ('Branch Manager', 80, 'Manage branch operations', '{"workforce": true, "docks": true, "projects": true, "tickets": true, "user_management": "branch"}', 1),
  ('Senior Manager', 60, 'Department leadership', '{"workforce": true, "docks": true, "projects": true, "tickets": true, "user_management": "department"}', 1),
  ('Manager', 40, 'Team management', '{"workforce": true, "docks": true, "projects": false, "tickets": true, "user_management": "team"}', 1),
  ('Team Leader', 20, 'Lead team members', '{"workforce": true, "docks": false, "projects": false, "tickets": true, "user_management": "view_team"}', 1),
  ('Employee', 10, 'Standard access', '{"workforce": false, "docks": false, "projects": false, "tickets": false, "user_management": "view_self"}', 1);
