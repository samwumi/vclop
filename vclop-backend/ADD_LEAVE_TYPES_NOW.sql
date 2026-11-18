-- Add leave types to populate the dropdown
-- Run this in your database (phpMyAdmin or any MySQL client)

-- First, check if table exists and see current data
SELECT COUNT(*) as current_count FROM leave_types;

-- Add Annual Leave
INSERT INTO leave_types (
  id, name, code, description, defaultDaysPerYear,
  carryForwardAllowed, maxCarryForwardDays, requiresApproval,
  minNoticeDays, maxConsecutiveDays, allowHalfDay,
  prorateForMidYearJoiners, countWeekendsAsLeave, countHolidaysAsLeave,
  isActive, sortOrder, createdAt, updatedAt
) VALUES (
  UUID(), 'Annual Leave', 'ANNUAL',
  'Regular annual vacation leave',
  21, 1, 5, 1, 7, 14, 1, 1, 0, 0, 1, 1, NOW(), NOW()
) ON DUPLICATE KEY UPDATE name = name;

-- Add Sick Leave
INSERT INTO leave_types (
  id, name, code, description, defaultDaysPerYear,
  carryForwardAllowed, maxCarryForwardDays, requiresApproval,
  minNoticeDays, maxConsecutiveDays, allowHalfDay,
  prorateForMidYearJoiners, countWeekendsAsLeave, countHolidaysAsLeave,
  isActive, sortOrder, createdAt, updatedAt
) VALUES (
  UUID(), 'Sick Leave', 'SICK',
  'Leave for illness or medical reasons',
  12, 1, 6, 1, 0, 14, 1, 1, 0, 0, 1, 2, NOW(), NOW()
) ON DUPLICATE KEY UPDATE name = name;

-- Add Compassionate Leave
INSERT INTO leave_types (
  id, name, code, description, defaultDaysPerYear,
  carryForwardAllowed, maxCarryForwardDays, requiresApproval,
  minNoticeDays, maxConsecutiveDays, allowHalfDay,
  prorateForMidYearJoiners, countWeekendsAsLeave, countHolidaysAsLeave,
  isActive, sortOrder, createdAt, updatedAt
) VALUES (
  UUID(), 'Compassionate Leave', 'COMPASSIONATE',
  'Leave for family emergencies, bereavement, or serious illness of immediate family members',
  5, 0, NULL, 1, 0, 5, 0, 1, 0, 0, 1, 3, NOW(), NOW()
) ON DUPLICATE KEY UPDATE name = name;

-- Add Education/Study Leave
INSERT INTO leave_types (
  id, name, code, description, defaultDaysPerYear,
  carryForwardAllowed, maxCarryForwardDays, requiresApproval,
  minNoticeDays, maxConsecutiveDays, allowHalfDay,
  prorateForMidYearJoiners, countWeekendsAsLeave, countHolidaysAsLeave,
  isActive, sortOrder, createdAt, updatedAt
) VALUES (
  UUID(), 'Education/Study Leave', 'EDUCATION',
  'Leave for attending courses, training, examinations, or professional development',
  10, 1, 5, 1, 14, 10, 1, 1, 0, 0, 1, 4, NOW(), NOW()
) ON DUPLICATE KEY UPDATE name = name;

-- Add Maternity Leave
INSERT INTO leave_types (
  id, name, code, description, defaultDaysPerYear,
  carryForwardAllowed, maxCarryForwardDays, requiresApproval,
  minNoticeDays, maxConsecutiveDays, allowHalfDay,
  prorateForMidYearJoiners, countWeekendsAsLeave, countHolidaysAsLeave,
  isActive, sortOrder, createdAt, updatedAt
) VALUES (
  UUID(), 'Maternity Leave', 'MATERNITY',
  'Maternity leave for expectant mothers',
  90, 0, NULL, 1, 30, 120, 0, 0, 1, 1, 1, 5, NOW(), NOW()
) ON DUPLICATE KEY UPDATE name = name;

-- Add Paternity Leave
INSERT INTO leave_types (
  id, name, code, description, defaultDaysPerYear,
  carryForwardAllowed, maxCarryForwardDays, requiresApproval,
  minNoticeDays, maxConsecutiveDays, allowHalfDay,
  prorateForMidYearJoiners, countWeekendsAsLeave, countHolidaysAsLeave,
  isActive, sortOrder, createdAt, updatedAt
) VALUES (
  UUID(), 'Paternity Leave', 'PATERNITY',
  'Leave for new fathers around the birth of their child',
  14, 0, NULL, 1, 14, 14, 0, 0, 1, 1, 1, 6, NOW(), NOW()
) ON DUPLICATE KEY UPDATE name = name;

-- Add Unpaid Leave
INSERT INTO leave_types (
  id, name, code, description, defaultDaysPerYear,
  carryForwardAllowed, maxCarryForwardDays, requiresApproval,
  minNoticeDays, maxConsecutiveDays, allowHalfDay,
  prorateForMidYearJoiners, countWeekendsAsLeave, countHolidaysAsLeave,
  isActive, sortOrder, createdAt, updatedAt
) VALUES (
  UUID(), 'Unpaid Leave', 'UNPAID',
  'Leave without pay for personal reasons',
  30, 0, NULL, 1, 14, 30, 0, 0, 1, 1, 1, 7, NOW(), NOW()
) ON DUPLICATE KEY UPDATE name = name;

-- Verify all leave types were added
SELECT 
  name,
  code,
  description,
  defaultDaysPerYear as 'Days/Year',
  sortOrder,
  isActive
FROM leave_types
WHERE isActive = 1
ORDER BY sortOrder, name;
