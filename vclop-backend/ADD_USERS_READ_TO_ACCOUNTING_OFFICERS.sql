-- Add users:read permission to Accounting Officers so they can see officer dropdown
-- The backend filters users by branch, so accounting officers only see officers in their location

-- First, verify the permission exists
DO $$
DECLARE
  v_permission_id UUID;
  v_acct_officer_role_id UUID;
  v_acct_head_role_id UUID;
BEGIN
  -- Get the users:read permission ID
  SELECT id INTO v_permission_id
  FROM "Permission"
  WHERE code = 'users:read';

  IF v_permission_id IS NULL THEN
    RAISE EXCEPTION 'Permission users:read not found';
  END IF;

  -- Get Accounting Officer role ID
  SELECT id INTO v_acct_officer_role_id
  FROM "Role"
  WHERE name = 'Accounting Officer';

  IF v_acct_officer_role_id IS NOT NULL THEN
    -- Add permission if not already present
    INSERT INTO "RolePermission" ("roleId", "permissionId")
    VALUES (v_acct_officer_role_id, v_permission_id)
    ON CONFLICT ("roleId", "permissionId") DO NOTHING;
    
    RAISE NOTICE 'Added users:read to Accounting Officer role (backend filters by branch)';
  ELSE
    RAISE NOTICE 'Accounting Officer role not found';
  END IF;

  -- Get Accounting Head role ID
  SELECT id INTO v_acct_head_role_id
  FROM "Role"
  WHERE name = 'Accounting Head' OR name = 'Head of Accounting';

  IF v_acct_head_role_id IS NOT NULL THEN
    -- Add permission if not already present
    INSERT INTO "RolePermission" ("roleId", "permissionId")
    VALUES (v_acct_head_role_id, v_permission_id)
    ON CONFLICT ("roleId", "permissionId") DO NOTHING;
    
    RAISE NOTICE 'Added users:read to Accounting Head role (full access)';
  ELSE
    RAISE NOTICE 'Accounting Head role not found';
  END IF;

END $$;

-- Verify the changes
SELECT 
  r.name as role_name,
  p.code as permission_code,
  p.description
FROM "Role" r
INNER JOIN "RolePermission" rp ON rp."roleId" = r.id
INNER JOIN "Permission" p ON p.id = rp."permissionId"
WHERE r.name ILIKE '%accounting%'
  AND p.code = 'users:read';
