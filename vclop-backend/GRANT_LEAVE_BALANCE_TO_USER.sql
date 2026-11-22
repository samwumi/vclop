-- Grant Leave Balance to Specific User (Quick Fix)
-- Replace 'user@example.com' with the actual user email

-- Step 1: Find the user
SELECT 
    id,
    username,
    email,
    firstName,
    lastName
FROM users
WHERE email = 'user@example.com'  -- REPLACE WITH ACTUAL EMAIL
  AND deletedAt IS NULL;

-- Step 2: Check what leave types are available
SELECT 
    id,
    code,
    name,
    defaultDaysPerYear
FROM leave_types
WHERE isActive = 1
  AND deletedAt IS NULL
ORDER BY name;

-- Step 3: Create entitlements for this user (modify as needed)
-- Replace @userId with the actual user ID from Step 1

SET @userId = 'USER_ID_HERE';  -- REPLACE WITH ACTUAL USER ID
SET @year = 2026;

-- Create Annual Leave (21 days)
INSERT INTO leave_entitlements (
    id,
    userId,
    leaveTypeId,
    year,
    allocatedDays,
    usedDays,
    pendingDays,
    carryForwardDays,
    effectiveFrom,
    effectiveTo,
    createdAt,
    updatedAt
)
SELECT 
    UUID(),
    @userId,
    id,
    @year,
    defaultDaysPerYear,
    0,
    0,
    0,
    CONCAT(@year, '-01-01 00:00:00'),
    CONCAT(@year, '-12-31 23:59:59'),
    NOW(),
    NOW()
FROM leave_types
WHERE code = 'ANNUAL'
  AND isActive = 1
  AND deletedAt IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM leave_entitlements 
    WHERE userId = @userId 
      AND leaveTypeId = leave_types.id 
      AND year = @year 
      AND deletedAt IS NULL
  );

-- Create Sick Leave (10 days)
INSERT INTO leave_entitlements (
    id,
    userId,
    leaveTypeId,
    year,
    allocatedDays,
    usedDays,
    pendingDays,
    carryForwardDays,
    effectiveFrom,
    effectiveTo,
    createdAt,
    updatedAt
)
SELECT 
    UUID(),
    @userId,
    id,
    @year,
    defaultDaysPerYear,
    0,
    0,
    0,
    CONCAT(@year, '-01-01 00:00:00'),
    CONCAT(@year, '-12-31 23:59:59'),
    NOW(),
    NOW()
FROM leave_types
WHERE code = 'SICK'
  AND isActive = 1
  AND deletedAt IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM leave_entitlements 
    WHERE userId = @userId 
      AND leaveTypeId = leave_types.id 
      AND year = @year 
      AND deletedAt IS NULL
  );

-- Create all other leave types
INSERT INTO leave_entitlements (
    id,
    userId,
    leaveTypeId,
    year,
    allocatedDays,
    usedDays,
    pendingDays,
    carryForwardDays,
    effectiveFrom,
    effectiveTo,
    createdAt,
    updatedAt
)
SELECT 
    UUID(),
    @userId,
    id,
    @year,
    defaultDaysPerYear,
    0,
    0,
    0,
    CONCAT(@year, '-01-01 00:00:00'),
    CONCAT(@year, '-12-31 23:59:59'),
    NOW(),
    NOW()
FROM leave_types
WHERE isActive = 1
  AND deletedAt IS NULL
  AND code NOT IN ('ANNUAL', 'SICK')
  AND NOT EXISTS (
    SELECT 1 FROM leave_entitlements 
    WHERE userId = @userId 
      AND leaveTypeId = leave_types.id 
      AND year = @year 
      AND deletedAt IS NULL
  );

-- Step 4: Verify the user now has leave balance
SELECT 
    u.username,
    u.email,
    lt.name as leave_type,
    lt.code,
    le.year,
    le.allocatedDays,
    le.usedDays,
    le.pendingDays,
    (le.allocatedDays - le.usedDays - le.pendingDays) as available_days
FROM users u
JOIN leave_entitlements le ON u.id = le.userId
JOIN leave_types lt ON le.leaveTypeId = lt.id
WHERE u.id = @userId
  AND le.year = @year
  AND le.deletedAt IS NULL
ORDER BY lt.name;
