-- ============================================================================
-- CREATE HR USER ACCOUNT
-- ============================================================================
-- This script creates a dedicated HR user account with full HR permissions
-- Username: hr
-- Password: HR@2024 (change after first login)
-- ============================================================================

-- Step 1: Get the Head Office branch ID (or use your main branch)
SET @branchId = (SELECT id FROM branches WHERE name LIKE '%Head Office%' OR name LIKE '%Main%' LIMIT 1);

-- If no branch found, use the first active branch
SET @branchId = IFNULL(@branchId, (SELECT id FROM branches WHERE deletedAt IS NULL LIMIT 1));

-- Step 2: Create the HR user (password: HR@2024)
-- Password hash for 'HR@2024' using bcrypt
INSERT INTO users (
    id,
    username,
    email,
    firstName,
    lastName,
    password,
    phoneNumber,
    status,
    branchId,
    createdAt,
    updatedAt
)
VALUES (
    UUID(),
    'hr',
    'hr@verticalcapital.ng',
    'HR',
    'Manager',
    '$2b$10$8XqN5mKZH7YzJYHxN9xVLO8vZ.5w3qXKxG5cP7wE9zX5h0P8/4Y9C', -- HR@2024
    '08000000000',
    'ACTIVE',
    @branchId,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE username=username; -- Skip if exists

-- Step 3: Get the HR user ID
SET @hrUserId = (SELECT id FROM users WHERE username = 'hr' LIMIT 1);

-- Step 4: Get or create HR role with all HR permissions
INSERT INTO roles (id, name, description, createdAt, updatedAt)
VALUES (
    UUID(),
    'HR Manager',
    'Full access to all HR modules including leaves, staff loans, employment, offboarding',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE name=name;

SET @hrRoleId = (SELECT id FROM roles WHERE name = 'HR Manager' LIMIT 1);

-- Step 5: Assign HR role to user
INSERT INTO user_roles (userId, roleId, createdAt, updatedAt)
VALUES (@hrUserId, @hrRoleId, NOW(), NOW())
ON DUPLICATE KEY UPDATE userId=userId;

-- Step 6: Grant all necessary HR permissions
-- Get permission IDs
SET @dashboardRead = (SELECT id FROM permissions WHERE code = 'dashboard:read' LIMIT 1);
SET @usersRead = (SELECT id FROM permissions WHERE code = 'users:read' LIMIT 1);
SET @leavesManage = (SELECT id FROM permissions WHERE code = 'leaves:manage' LIMIT 1);
SET @leavesRead = (SELECT id FROM permissions WHERE code = 'leaves:read' LIMIT 1);
SET @leavesApprove = (SELECT id FROM permissions WHERE code = 'leaves:approve' LIMIT 1);
SET @employmentRead = (SELECT id FROM permissions WHERE code = 'employment:read' LIMIT 1);
SET @employmentUpdate = (SELECT id FROM permissions WHERE code = 'employment:update' LIMIT 1);
SET @offboardingRead = (SELECT id FROM permissions WHERE code = 'offboarding:read' LIMIT 1);
SET @offboardingUpdate = (SELECT id FROM permissions WHERE code = 'offboarding:update' LIMIT 1);
SET @staffLoansRead = (SELECT id FROM permissions WHERE code = 'staff_loans:read' LIMIT 1);
SET @staffLoansApprove = (SELECT id FROM permissions WHERE code = 'staff_loans:approve' LIMIT 1);
SET @resourcesRead = (SELECT id FROM permissions WHERE code = 'resources:read' LIMIT 1);
SET @reportsRead = (SELECT id FROM permissions WHERE code = 'reports:read' LIMIT 1);

-- Assign permissions to HR role
INSERT INTO role_permissions (roleId, permissionId, createdAt, updatedAt)
SELECT @hrRoleId, id, NOW(), NOW()
FROM permissions
WHERE code IN (
    'dashboard:read',
    'users:read',
    'leaves:read',
    'leaves:manage',
    'leaves:approve',
    'employment:read',
    'employment:update',
    'offboarding:read',
    'offboarding:update',
    'staff_loans:read',
    'staff_loans:approve',
    'resources:read',
    'resources:update',
    'reports:read'
)
ON DUPLICATE KEY UPDATE roleId=roleId;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

SELECT '=== HR User Created ===' AS '';
SELECT 
    id,
    username,
    email,
    CONCAT(firstName, ' ', lastName) AS fullName,
    status,
    b.name AS branch
FROM users u
LEFT JOIN branches b ON u.branchId = b.id
WHERE u.username = 'hr';

SELECT '=== HR User Roles ===' AS '';
SELECT 
    r.name AS role,
    r.description
FROM user_roles ur
JOIN roles r ON ur.roleId = r.id
JOIN users u ON ur.userId = u.id
WHERE u.username = 'hr';

SELECT '=== HR User Permissions ===' AS '';
SELECT 
    p.code AS permission,
    p.name AS permission_name
FROM role_permissions rp
JOIN permissions p ON rp.permissionId = p.id
JOIN roles r ON rp.roleId = r.id
JOIN user_roles ur ON ur.roleId = r.id
JOIN users u ON ur.userId = u.id
WHERE u.username = 'hr'
ORDER BY p.code;

-- ============================================================================
-- LOGIN CREDENTIALS
-- ============================================================================
SELECT '
╔════════════════════════════════════════════════════════════════╗
║                     HR USER LOGIN CREDENTIALS                   ║
╠════════════════════════════════════════════════════════════════╣
║  Username:  hr                                                 ║
║  Password:  HR@2024                                            ║
║  Email:     hr@verticalcapital.ng                              ║
╠════════════════════════════════════════════════════════════════╣
║  IMPORTANT: Change password after first login!                 ║
╚════════════════════════════════════════════════════════════════╝
' AS 'LOGIN_INFO';
