# Leave Management Enhancements

## ✅ Completed Features

### 1. New Leave Categories Added

The following leave types have been added to the system:

| Leave Type | Code | Days/Year | Carry Forward | Min Notice | Description |
|------------|------|-----------|---------------|------------|-------------|
| **Annual Leave** | ANNUAL | 21 | Yes (5 days) | 7 days | Regular vacation leave |
| **Sick Leave** | SICK | 12 | Yes (6 days) | 0 days | Medical illness |
| **Compassionate Leave** | COMPASSIONATE | 5 | No | 0 days | Family emergencies, bereavement |
| **Education/Study Leave** | EDUCATION | 10 | Yes (5 days) | 14 days | Training, courses, exams |
| **Maternity Leave** | MATERNITY | 90 | No | 30 days | Expectant mothers |
| **Paternity Leave** | PATERNITY | 14 | No | 14 days | New fathers |
| **Unpaid Leave** | UNPAID | 30 | No | 14 days | Leave without pay |

### 2. Backdated Leave Applications

**Feature**: Staff can now apply for leave with past dates.

**Use Case**: 
- Staff who are already on leave before the system was created
- Forgot to submit leave application
- Emergency leaves that happened in the past

**How it works**:
- Start date validation removed (was: `@MinDate(new Date())`)
- System allows any date (past, present, or future)
- HR can approve backdated applications

### 3. Resumption Date Display

**Feature**: The system automatically calculates and displays the resumption date.

**Calculation**: `Resumption Date = End Date + 1 day`

**Display**:
```
Expected Resumption Date
Monday, November 25, 2026
You will return to work on this date
```

**Benefits**:
- Clear return-to-work date
- No confusion about when to resume
- Helps with planning and handover

### 4. Leave Type Dropdown

The dropdown is populated from the database with all active leave types:

```typescript
<select>
  <option value="">Select leave type</option>
  {leaveTypes?.map((type) => (
    <option key={type.id} value={type.id}>
      {type.name} ({type.code})
    </option>
  ))}
</select>
```

**Features**:
- Shows leave type name and code
- Displays description below dropdown
- Shows available balance when type is selected
- Real-time balance updates

## 🗄️ Database Setup

### To Add Leave Categories

Run the SQL script to populate leave types:

```bash
# In your database management tool (phpMyAdmin, DBeaver, etc.)
# Run: ADD_LEAVE_CATEGORIES.sql
```

This will:
1. Add all 7 leave categories
2. Configure default days, carry-forward rules, and approval requirements
3. Set appropriate sort orders

### To Check Existing Leave Types

```bash
# Run: CHECK_EXISTING_LEAVE_TYPES.sql
```

## 📋 Leave Application Workflow

### For Staff:

1. **Navigate**: HR → My Leaves → Apply for Leave
2. **Select Leave Type**: Choose from dropdown (Annual, Sick, Compassionate, Education, etc.)
3. **View Balance**: System shows your remaining balance for selected type
4. **Select Dates**: 
   - Start date (can be past, present, or future)
   - End date
   - Choose full day or half day options
5. **See Resumption**: System automatically shows when you'll return to work
6. **Provide Reason**: Enter justification for leave
7. **Submit**: Either "Submit for Approval" or "Save as Draft"

### For HR/Managers:

1. **View Applications**: HR → Leave Management → Pending Applications
2. **Review Details**: 
   - Leave type, dates, duration
   - Reason and staff balance
   - Resumption date
3. **Approve/Reject**: Make decision with optional notes

## 🎯 Key Improvements

### Before:
- ❌ Limited leave types
- ❌ No compassionate or education leave
- ❌ Could not apply for past dates
- ❌ No resumption date shown
- ❌ Unclear return-to-work dates

### After:
- ✅ 7 comprehensive leave categories
- ✅ Compassionate and Education leave types added
- ✅ Backdated applications supported
- ✅ Resumption date automatically calculated
- ✅ Clear return-to-work date display
- ✅ Info notice explains backdated leave feature

## 📱 UI Enhancements

### Resumption Date Card
```
┌─────────────────────────────────────────┐
│ 📅 Expected Resumption Date             │
│ Monday, November 25, 2026               │
│ You will return to work on this date    │
└─────────────────────────────────────────┘
```

### Info Notice
```
ℹ️ Note: You can apply for past dates if you're already 
on leave or forgot to submit. The system will show your 
resumption date (return to work date) as one day after 
your end date.
```

## 🔧 Technical Changes

### Backend (`create-leave-application.dto.ts`)
```typescript
// Before:
@MinDate(new Date())
startDate!: Date;

// After: (commented out to allow past dates)
// @MinDate(new Date())
startDate!: Date;
```

### Frontend (`LeaveApplicationPage.tsx`)
```typescript
// Added resumption date calculation
const getResumptionDate = () => {
  if (!formData.endDate) return null;
  const end = new Date(formData.endDate);
  const resumption = new Date(end);
  resumption.setDate(resumption.getDate() + 1);
  return resumption;
};
```

## 📝 SQL Scripts Provided

1. **CHECK_EXISTING_LEAVE_TYPES.sql**
   - View all current leave types
   - Check configurations

2. **ADD_LEAVE_CATEGORIES.sql**
   - Add all 7 leave categories
   - Configure defaults and rules
   - Verify additions

## 🚀 Deployment

1. ✅ Code changes committed and pushed
2. ⏳ Deployment in progress
3. 🗄️ **Action Required**: Run `ADD_LEAVE_CATEGORIES.sql` in your database

## 📊 Expected Results

After deployment and database update:

1. **Leave Type Dropdown**: Shows all 7 categories
2. **Backdated Applications**: Can select past dates without validation errors
3. **Resumption Display**: Automatically shows return date when dates are selected
4. **Balance Tracking**: Proper balance calculation for each leave type

## 🎓 Leave Categories Explained

### Compassionate Leave
- **Purpose**: Family emergencies, bereavement, critical illness of immediate family
- **Days**: 5 per year
- **Notice**: None required (can be immediate/emergency)
- **Use Case**: Death in family, serious illness of parent/child/spouse

### Education/Study Leave
- **Purpose**: Professional development, training, examinations, courses
- **Days**: 10 per year (carry forward 5)
- **Notice**: 14 days advance notice
- **Use Case**: Attending workshops, taking certification exams, university courses

## ✨ Next Steps

1. Run `ADD_LEAVE_CATEGORIES.sql` to populate leave types
2. Test leave application with different categories
3. Verify resumption date calculation
4. Test backdated leave applications
5. Configure leave entitlements for staff

---

**Summary**: Leave management is now fully enhanced with 7 leave categories, backdated application support, and automatic resumption date calculation. The dropdown will populate once the SQL script is executed.
