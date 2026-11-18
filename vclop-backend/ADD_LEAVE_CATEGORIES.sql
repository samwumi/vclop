-- Add new leave categories: Compassionate, Education, and others
-- This enhances the leave management system with more leave types

-- 1. Compassionate Leave (for family emergencies, bereavement)
INSERT INTO leave_types (
  id,
  name,
  code,
  description,
  defaultDaysPerYear,
  carryForwardAllowed,
  maxCarryForwardDays,
  requiresApproval,
  minNoticeDays,
  maxConsecutiveDays,
  allowHalfDay,
  prorateForMidYearJoiners,
  countWeekendsAsLeave,
  countHolidaysAsLeave,
  isActive,
  sortOrder,
  createdAt,
  updatedAt
) VALUES (
  UUID(),
  'Compassionate Leave',
  'COMPASSIONATE',
  'Leave for family emergencies, bereavement, or serious illness of immediate family members',
  5, -- 5 days per year
  0, -- No carry forward
  NULL,
  1, -- Requires approval
  0, -- No minimum notice (can be immediate)
  5, -- Max 5 consecutive days
  0, -- No half day allowed
  1, -- Prorated for mid-year joiners
  0, -- Weekends don't count
  0, -- Holidays don't count
  1, -- Active
  3, -- Sort order
  NOW(),
  NOW()
);

-- 2. Education/Study Leave (for training, exams, courses)
INSERT INTO leave_types (
  id,
  name,
  code,
  description,
  defaultDaysPerYear,
  carryForwardAllowed,
  maxCarryForwardDays,
  requiresApproval,
  minNoticeDays,
  maxConsecutiveDays,
  allowHalfDay,
  prorateForMidYearJoiners,
  countWeekendsAsLeave,
  countHolidaysAsLeave,
  isActive,
  sortOrder,
  createdAt,
  updatedAt
) VALUES (
  UUID(),
  'Education/Study Leave',
  'EDUCATION',
  'Leave for attending courses, training, examinations, or professional development',
  10, -- 10 days per year
  1, -- Carry forward allowed
  5, -- Max 5 days carry forward
  1, -- Requires approval
  14, -- 14 days minimum notice
  10, -- Max 10 consecutive days
  1, -- Half day allowed
  1, -- Prorated for mid-year joiners
  0, -- Weekends don't count
  0, -- Holidays don't count
  1, -- Active
  4, -- Sort order
  NOW(),
  NOW()
);

-- 3. Maternity Leave (if not exists)
INSERT IGNORE INTO leave_types (
  id,
  name,
  code,
  description,
  defaultDaysPerYear,
  carryForwardAllowed,
  maxCarryForwardDays,
  requiresApproval,
  minNoticeDays,
  maxConsecutiveDays,
  allowHalfDay,
  prorateForMidYearJoiners,
  countWeekendsAsLeave,
  countHolidaysAsLeave,
  isActive,
  sortOrder,
  createdAt,
  updatedAt
) VALUES (
  UUID(),
  'Maternity Leave',
  'MATERNITY',
  'Maternity leave for expectant mothers (typically 90-120 days based on policy)',
  90, -- 90 days (3 months)
  0, -- No carry forward
  NULL,
  1, -- Requires approval
  30, -- 30 days minimum notice
  120, -- Max 120 consecutive days (4 months)
  0, -- No half day
  0, -- Not prorated
  1, -- Weekends count as leave
  1, -- Holidays count as leave
  1, -- Active
  5, -- Sort order
  NOW(),
  NOW()
);

-- 4. Paternity Leave (if not exists)
INSERT IGNORE INTO leave_types (
  id,
  name,
  code,
  description,
  defaultDaysPerYear,
  carryForwardAllowed,
  maxCarryForwardDays,
  requiresApproval,
  minNoticeDays,
  maxConsecutiveDays,
  allowHalfDay,
  prorateForMidYearJoiners,
  countWeekendsAsLeave,
  countHolidaysAsLeave,
  isActive,
  sortOrder,
  createdAt,
  updatedAt
) VALUES (
  UUID(),
  'Paternity Leave',
  'PATERNITY',
  'Leave for new fathers around the birth of their child',
  14, -- 14 days (2 weeks)
  0, -- No carry forward
  NULL,
  1, -- Requires approval
  14, -- 14 days minimum notice
  14, -- Max 14 consecutive days
  0, -- No half day
  0, -- Not prorated
  1, -- Weekends count as leave
  1, -- Holidays count as leave
  1, -- Active
  6, -- Sort order
  NOW(),
  NOW()
);

-- 5. Sick Leave (if not exists)
INSERT IGNORE INTO leave_types (
  id,
  name,
  code,
  description,
  defaultDaysPerYear,
  carryForwardAllowed,
  maxCarryForwardDays,
  requiresApproval,
  minNoticeDays,
  maxConsecutiveDays,
  allowHalfDay,
  prorateForMidYearJoiners,
  countWeekendsAsLeave,
  countHolidaysAsLeave,
  isActive,
  sortOrder,
  createdAt,
  updatedAt
) VALUES (
  UUID(),
  'Sick Leave',
  'SICK',
  'Leave for illness or medical reasons (medical certificate may be required for >3 days)',
  12, -- 12 days per year
  1, -- Carry forward allowed
  6, -- Max 6 days carry forward
  1, -- Requires approval (post-facto for emergencies)
  0, -- No minimum notice (can be same day)
  14, -- Max 14 consecutive days without medical cert
  1, -- Half day allowed
  1, -- Prorated for mid-year joiners
  0, -- Weekends don't count
  0, -- Holidays don't count
  1, -- Active
  2, -- Sort order
  NOW(),
  NOW()
);

-- 6. Annual Leave (if not exists)
INSERT IGNORE INTO leave_types (
  id,
  name,
  code,
  description,
  defaultDaysPerYear,
  carryForwardAllowed,
  maxCarryForwardDays,
  requiresApproval,
  minNoticeDays,
  maxConsecutiveDays,
  allowHalfDay,
  prorateForMidYearJoiners,
  countWeekendsAsLeave,
  countHolidaysAsLeave,
  isActive,
  sortOrder,
  createdAt,
  updatedAt
) VALUES (
  UUID(),
  'Annual Leave',
  'ANNUAL',
  'Regular annual vacation leave',
  21, -- 21 days per year
  1, -- Carry forward allowed
  5, -- Max 5 days carry forward
  1, -- Requires approval
  7, -- 7 days minimum notice
  14, -- Max 14 consecutive days
  1, -- Half day allowed
  1, -- Prorated for mid-year joiners
  0, -- Weekends don't count
  0, -- Holidays don't count
  1, -- Active
  1, -- Sort order
  NOW(),
  NOW()
);

-- 7. Unpaid Leave
INSERT IGNORE INTO leave_types (
  id,
  name,
  code,
  description,
  defaultDaysPerYear,
  carryForwardAllowed,
  maxCarryForwardDays,
  requiresApproval,
  minNoticeDays,
  maxConsecutiveDays,
  allowHalfDay,
  prorateForMidYearJoiners,
  countWeekendsAsLeave,
  countHolidaysAsLeave,
  isActive,
  sortOrder,
  createdAt,
  updatedAt
) VALUES (
  UUID(),
  'Unpaid Leave',
  'UNPAID',
  'Leave without pay for personal reasons after exhausting other leave types',
  30, -- 30 days per year (max allowed)
  0, -- No carry forward
  NULL,
  1, -- Requires approval
  14, -- 14 days minimum notice
  30, -- Max 30 consecutive days
  0, -- No half day
  0, -- Not prorated
  1, -- Weekends count
  1, -- Holidays count
  1, -- Active
  7, -- Sort order
  NOW(),
  NOW()
);

-- Verify all leave types
SELECT 
  name,
  code,
  description,
  defaultDaysPerYear as 'Days/Year',
  requiresApproval as 'Needs Approval',
  minNoticeDays as 'Min Notice',
  sortOrder
FROM leave_types
WHERE isActive = 1
ORDER BY sortOrder, name;
