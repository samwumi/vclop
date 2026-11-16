# Deploy Work History Feature

## What was done:
1. ✅ Created `employee_work_history` table schema
2. ✅ Added Prisma model and generated client
3. ✅ Created backend endpoints (CRUD for work history)
4. ✅ Created frontend UI (form, display, edit, delete)
5. ✅ Built and committed changes
6. ✅ Pushed to GitHub (commit: 05216824)

## What's left:
**Run the database migration on production**

### Option 1: Run migration via phpMyAdmin
1. Login to phpMyAdmin at https://verticalcapital.ng/phpmyadmin
2. Select database: `u215495167_vclop`
3. Go to SQL tab
4. Copy and paste the contents of `vclop-backend/ADD_WORK_HISTORY_TABLE.sql`
5. Click "Go" to execute

### Option 2: SSH into server
```bash
# SSH into server
ssh your_user@verticalcapital.ng

# Navigate to project
cd /path/to/vclop-backend

# Run migration
mysql -u u215495167_vclop -p u215495167_vclop < ADD_WORK_HISTORY_TABLE.sql
```

### Option 3: Pull and restart
If you have auto-deployment setup:
```bash
# On server
cd /path/to/vclop
git pull origin main
cd vclop-backend
pm2 restart vclop-backend
```

## Migration SQL:
The migration file is at: `vclop-backend/ADD_WORK_HISTORY_TABLE.sql`

It creates the `employee_work_history` table with:
- id (UUID primary key)
- employmentPeriodId (foreign key to employment_periods)
- companyName (previous company name)
- position (job title at previous company)
- startDate, endDate (employment duration)
- responsibilities (text)
- reasonForLeaving (text)
- createdAt, updatedAt (timestamps)

## Feature Overview:
- Employees can add their previous work experience from OTHER companies (not internal job history)
- Maximum 2 entries allowed (enforced in both backend and frontend)
- Work history is editable only when employment record is editable
- Work history shows on "Employment Details" tab in My Employment page
- Form includes: Company Name, Position, Start Date, End Date, Responsibilities, Reason for Leaving

## Testing:
1. Login as an employee who has an employment record
2. Go to "My Employment" page
3. On "Employment Details" tab, scroll to "Previous Work Experience" section
4. Click "Add Work History" button
5. Fill in the form and submit
6. Verify the entry appears
7. Try editing and deleting
8. Try adding a second entry
9. Verify you cannot add a third entry (max 2)

## Endpoints Created:
- GET /api/v1/hr/employees/:id/work-history - Get work history for user
- POST /api/v1/hr/employees/:id/work-history - Create work history entry
- PUT /api/v1/hr/employees/work-history/:workHistoryId - Update entry
- DELETE /api/v1/hr/employees/work-history/:workHistoryId - Delete entry

All endpoints include proper authorization (only the employee can manage their own work history).
