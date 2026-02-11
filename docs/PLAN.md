
# Orchestration Plan: Fix RLS & User Provisioning

## Problem Analysis
The user is encountering `new row violates row-level security policy for table "clients"`.
- **Root Cause**: The current user likely lacks a `profiles` and `tenants` record.
- **Why**: The user might have created the account *before* the trigger was added, or the trigger failed.
- **Goal**: Repair the existing user account and ensure the trigger works for future users.

## Proposed Strategy

### 1. Database Repair (Agent: `database-architect`)
- Create a SQL script (`database/repair_orphaned_users.sql`) that:
  - Iterates over `auth.users`.
  - Checks if a `public.profiles` record exists.
  - If missing, creates a `tenants` record and a `profiles` record.
- Review and harden the `handle_new_user` trigger in `database/schema.sql`.

### 2. Verification (Agent: `test-engineer`)
- Define verification steps:
  - Run the repair script.
  - Logout/Login (to refresh session claims if needed).
  - Try creating a Client again.

### 3. Frontend/Auth Check (Agent: `backend-specialist`)
- Review `AuthProvider` to see if we can detect "missing profile" state and warn the user.

## Execution Steps
1. **[Database]**: Generate `database/repair_orphaned_users.sql`.
2. **[Database]**: Update `database/schema.sql` to include the orphan fix logic as a standard procedure.
3. **[User Action]**: Ask user to run the repair script.
