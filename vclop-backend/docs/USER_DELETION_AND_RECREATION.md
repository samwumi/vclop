# User Deletion and Recreation Guide

## Overview
This system now supports both soft deletion and permanent (hard) deletion of users, with the ability to recreate users with the same credentials after deletion.

## Changes Made

### 1. Database Schema Updates
- **Modified unique constraints** on the `users` table to be composite constraints that include `deletedAt`
- This allows the same email, username, or phone to be reused after a user is soft-deleted
- Old constraints: `UNIQUE(email)`, `UNIQUE(username)`, `UNIQUE(phone)`
- New constraints: `UNIQUE(email, deletedAt)`, `UNIQUE(username, deletedAt)`, `UNIQUE(phone, deletedAt)`

### 2. User Creation Logic
Updated the `create` method in `UsersService` to only check for duplicates among **non-deleted users** (`deletedAt = null`). This allows recreating users with the same credentials after they've been soft-deleted.

### 3. Hard Delete Functionality
Added a new `hardDelete` method that **permanently removes** a user from the database:

**Endpoint:** `DELETE /api/v1/users/:id/permanent`

**Required Permission:** `users:delete`

**Warning:** This action is **irreversible** and will cascade delete all related records including:
- User roles
- User permissions
- User branches
- Tokens
- Audit logs
- Dashboard layouts
- Notification preferences

## API Endpoints

### Soft Delete (Existing)
```
DELETE /api/v1/users/:id
```
- Sets `deletedAt` timestamp
- Sets user status to `INACTIVE`
- User can be restored later
- Email/username/phone are reserved and cannot be reused until hard deleted

### Hard Delete (New)
```
DELETE /api/v1/users/:id/permanent
```
- **Permanently removes** the user from the database
- **Cannot be undone**
- Frees up email/username/phone for reuse
- Cascades to all related records

### Restore User (Existing)
```
POST /api/v1/users/:id/restore
```
- Restores a soft-deleted user
- Sets `deletedAt` to `null`
- Sets status to `INACTIVE` (admin must manually activate)

## Usage Examples

### Scenario 1: Soft Delete and Recreate
1. Soft delete a user: `DELETE /api/v1/users/{userId}`
2. Try to create new user with same email → **Will fail** (email still reserved)
3. Hard delete the user: `DELETE /api/v1/users/{userId}/permanent`
4. Create new user with same email → **Success** (email is now available)

### Scenario 2: Soft Delete and Restore
1. Soft delete a user: `DELETE /api/v1/users/{userId}`
2. Restore the user: `POST /api/v1/users/{userId}/restore`
3. User is back with all data intact

### Scenario 3: Employee Returns After Termination
1. Employee leaves company → Soft delete their account
2. Employee returns months later → Hard delete old account
3. Create fresh account with same email address

## Security Considerations

1. **Audit Trail**: Hard deletes are logged in audit logs with the admin's ID who performed the action
2. **Self-Protection**: Users cannot delete their own accounts (soft or hard)
3. **Permission Required**: Only users with `users:delete` permission can perform deletions
4. **Cascade Impact**: Be aware that hard delete removes ALL related data

## Migration

The database migration `20260902000001_allow_user_recreation_after_deletion` has been applied to update the constraints. No manual intervention needed for existing data.

## Best Practices

1. **Use soft delete by default** to maintain audit trails and allow restoration
2. **Use hard delete only when**:
   - You need to free up an email/username/phone for reuse
   - You have legal requirements to permanently delete user data (GDPR, etc.)
   - The account was created in error
3. **Always confirm** with users before performing hard deletes
4. **Export data** if needed before hard deletion (cannot be recovered)

## Testing

To verify the changes work correctly:

1. Create a test user with email `test@example.com`
2. Soft delete the user
3. Try creating a new user with `test@example.com` → Should fail with "already exists"
4. Hard delete the user: `DELETE /api/v1/users/{userId}/permanent`
5. Create a new user with `test@example.com` → Should succeed

## Notes

- The database now uses composite unique constraints `(email, deletedAt)`, `(username, deletedAt)`, `(phone, deletedAt)`
- MySQL treats `NULL` values as distinct, so multiple deleted users with the same email can exist
- Only one active (non-deleted) user can have a given email/username/phone at a time
