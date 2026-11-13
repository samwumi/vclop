-- Simple HR Permissions (using existing permissions table structure)

-- Employment permissions
INSERT INTO permissions (id, code, name, description, category, module, action, createdAt, updatedAt)
VALUES
  (UUID(), 'employment:read', 'View Employment History', 'View employment history and details', 'USER_MANAGEMENT', 'hr', 'read', NOW(), NOW()),
  (UUID(), 'employment:create', 'Create Employment', 'Create employment periods', 'USER_MANAGEMENT', 'hr', 'create', NOW(), NOW()),
  (UUID(), 'employment:update', 'Update Employment', 'Update employment details', 'USER_MANAGEMENT', 'hr', 'update', NOW(), NOW())
ON DUPLICATE KEY UPDATE description=VALUES(description), updatedAt=NOW();

-- Leave permissions
INSERT INTO permissions (id, code, name, description, category, module, action, createdAt, updatedAt)
VALUES
  (UUID(), 'leaves:read', 'View Leaves', 'View own leave applications', 'USER_MANAGEMENT', 'hr', 'read', NOW(), NOW()),
  (UUID(), 'leaves:create', 'Apply for Leave', 'Create leave applications', 'USER_MANAGEMENT', 'hr', 'create', NOW(), NOW()),
  (UUID(), 'leaves:approve', 'Approve Leaves', 'Approve leave applications', 'USER_MANAGEMENT', 'hr', 'approve', NOW(), NOW()),
  (UUID(), 'leaves:manage', 'Manage Leaves', 'Manage all leaves', 'USER_MANAGEMENT', 'hr', 'manage', NOW(), NOW())
ON DUPLICATE KEY UPDATE description=VALUES(description), updatedAt=NOW();

-- Staff loan permissions
INSERT INTO permissions (id, code, name, description, category, module, action, createdAt, updatedAt)
VALUES
  (UUID(), 'staff_loans:read', 'View Staff Loans', 'View own staff loans', 'USER_MANAGEMENT', 'hr', 'read', NOW(), NOW()),
  (UUID(), 'staff_loans:create', 'Apply for Staff Loan', 'Apply for staff loans', 'USER_MANAGEMENT', 'hr', 'create', NOW(), NOW()),
  (UUID(), 'staff_loans:approve', 'Approve Staff Loans', 'Approve staff loans', 'USER_MANAGEMENT', 'hr', 'approve', NOW(), NOW()),
  (UUID(), 'staff_loans:disburse', 'Disburse Staff Loans', 'Disburse staff loans', 'USER_MANAGEMENT', 'hr', 'disburse', NOW(), NOW())
ON DUPLICATE KEY UPDATE description=VALUES(description), updatedAt=NOW();

-- Resource permissions
INSERT INTO permissions (id, code, name, description, category, module, action, createdAt, updatedAt)
VALUES
  (UUID(), 'resources:read', 'View Resources', 'View resource assignments', 'USER_MANAGEMENT', 'hr', 'read', NOW(), NOW()),
  (UUID(), 'resources:assign', 'Assign Resources', 'Assign resources', 'USER_MANAGEMENT', 'hr', 'create', NOW(), NOW()),
  (UUID(), 'resources:delegate', 'Delegate Resources', 'Delegate resources', 'USER_MANAGEMENT', 'hr', 'delegate', NOW(), NOW())
ON DUPLICATE KEY UPDATE description=VALUES(description), updatedAt=NOW();

-- Offboarding permissions
INSERT INTO permissions (id, code, name, description, category, module, action, createdAt, updatedAt)
VALUES
  (UUID(), 'offboarding:read', 'View Offboarding', 'View offboarding cases', 'USER_MANAGEMENT', 'hr', 'read', NOW(), NOW()),
  (UUID(), 'offboarding:initiate', 'Initiate Offboarding', 'Start offboarding', 'USER_MANAGEMENT', 'hr', 'create', NOW(), NOW()),
  (UUID(), 'offboarding:it_clear', 'IT Clearance', 'Process IT clearance', 'USER_MANAGEMENT', 'hr', 'update', NOW(), NOW()),
  (UUID(), 'offboarding:finance_clear', 'Finance Clearance', 'Process finance clearance', 'USER_MANAGEMENT', 'hr', 'update', NOW(), NOW())
ON DUPLICATE KEY UPDATE description=VALUES(description), updatedAt=NOW();

-- Verify
SELECT 'HR Permissions Created' as status;
SELECT code, name FROM permissions WHERE module = 'hr' ORDER BY code;
