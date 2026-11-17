# Leave Management Enhancement Plan

## Requirements
1. **Leave Categories/Purposes**: Add compassionate, education, and other specific leave purposes
2. **Backdated Applications**: Allow staff to record leave they're already on (started before module)
3. **Resumption Date Display**: Show when staff will resume work (day after endDate)

## Current Schema Analysis
- `LeaveType`: Defines leave categories (Annual, Sick, Maternity, etc.)
- `LeaveApplication`: Has `startDate`, `endDate`, `reason` field
- Missing: Specific "purpose" or "category" field for compassionate/education subcategories

## Implementation Options

### Option 1: Add Leave Purpose/Category Field (Recommended)
- Add `purpose` enum field to `LeaveApplication`
- Values: COMPASSIONATE, EDUCATION, MEDICAL, PERSONAL, FAMILY, BEREAVEMENT, STUDY, TRAINING, OTHER
- Keep `reason` as free text for detailed explanation
- This allows:
  - Staff to select a general purpose from dropdown
  - Provide detailed reason in text field
  - Better reporting and analytics

### Option 2: Use LeaveType for Each Purpose
- Create separate leave types: "Compassionate Leave", "Education Leave", etc.
- Simpler but less flexible

## Recommended Approach

### 1. Database Changes
```prisma
enum LeavePurpose {
  COMPASSIONATE    // Death in family, serious illness of relative
  EDUCATION        // Training, courses, exams
  MEDICAL          // Personal medical appointments, procedures
  FAMILY           // Child care, family emergencies
  BEREAVEMENT      // Attending funeral
  STUDY            // Study leave for exams
  TRAINING         // Professional development
  PERSONAL         // Personal matters
  RELOCATION       // Moving house
  RELIGIOUS        // Religious observances
  OTHER
}

model LeaveApplication {
  ...
  purpose LeavePurpose?  // Optional: specific categorization
  reason  String         // Detailed explanation (required)
  ...
}
```

### 2. Backdated Applications
- Remove validation that prevents `startDate` in the past
- Add `isBackdated` boolean flag
- Show special UI indicator for backdated leaves
- Automatically calculate resumption date

### 3. Resumption Date
- Calculate as: `endDate + 1 day` (considering endDayType)
- Display prominently in UI
- If endDayType is HALF_DAY, resumption is same day afternoon or next morning

### 4. Frontend Changes
- Add Purpose dropdown in leave application form
- Allow past dates for startDate with warning
- Display resumption date prominently
- Add "Currently on Leave" indicator

## Questions for User
1. Do you want compassionate/education as **LeaveType** (separate leave type with own entitlement) or **Purpose** (subcategory within a leave type)?
2. What specific purposes/categories do you need beyond compassionate and education?
3. Should backdated leaves require special approval or just documentation?
4. How should resumption date handle weekends/holidays?
