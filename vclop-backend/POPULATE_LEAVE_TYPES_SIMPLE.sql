-- Simple script to add all leave types
-- Copy and paste this entire script into phpMyAdmin SQL tab and click "Go"

-- Annual Leave
INSERT INTO leave_types (id, name, code, description, defaultDaysPerYear, carryForwardAllowed, maxCarryForwardDays, requiresApproval, minNoticeDays, maxConsecutiveDays, allowHalfDay, prorateForMidYearJoiners, countWeekendsAsLeave, countHolidaysAsLeave, isActive, sortOrder, createdAt, updatedAt)
SELECT UUID(), 'Annual Leave', 'ANNUAL', 'Regular annual vacation leave', 21, 1, 5, 1, 7, 14, 1, 1, 0, 0, 1, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE code = 'ANNUAL');

-- Sick Leave
INSERT INTO leave_types (id, name, code, description, defaultDaysPerYear, carryForwardAllowed, maxCarryForwardDays, requiresApproval, minNoticeDays, maxConsecutiveDays, allowHalfDay, prorateForMidYearJoiners, countWeekendsAsLeave, countHolidaysAsLeave, isActive, sortOrder, createdAt, updatedAt)
SELECT UUID(), 'Sick Leave', 'SICK', 'Leave for illness or medical reasons', 12, 1, 6, 1, 0, 14, 1, 1, 0, 0, 1, 2, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE code = 'SICK');

-- Compassionate Leave
INSERT INTO leave_types (id, name, code, description, defaultDaysPerYear, carryForwardAllowed, maxCarryForwardDays, requiresApproval, minNoticeDays, maxConsecutiveDays, allowHalfDay, prorateForMidYearJoiners, countWeekendsAsLeave, countHolidaysAsLeave, isActive, sortOrder, createdAt, updatedAt)
SELECT UUID(), 'Compassionate Leave', 'COMPASSIONATE', 'Leave for family emergencies, bereavement, or serious illness of immediate family members', 5, 0, NULL, 1, 0, 5, 0, 1, 0, 0, 1, 3, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE code = 'COMPASSIONATE');

-- Education/Study Leave
INSERT INTO leave_types (id, name, code, description, defaultDaysPerYear, carryForwardAllowed, maxCarryForwardDays, requiresApproval, minNoticeDays, maxConsecutiveDays, allowHalfDay, prorateForMidYearJoiners, countWeekendsAsLeave, countHolidaysAsLeave, isActive, sortOrder, createdAt, updatedAt)
SELECT UUID(), 'Education/Study Leave', 'EDUCATION', 'Leave for attending courses, training, examinations, or professional development', 10, 1, 5, 1, 14, 10, 1, 1, 0, 0, 1, 4, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE code = 'EDUCATION');

-- Maternity Leave
INSERT INTO leave_types (id, name, code, description, defaultDaysPerYear, carryForwardAllowed, maxCarryForwardDays, requiresApproval, minNoticeDays, maxConsecutiveDays, allowHalfDay, prorateForMidYearJoiners, countWeekendsAsLeave, countHolidaysAsLeave, isActive, sortOrder, createdAt, updatedAt)
SELECT UUID(), 'Maternity Leave', 'MATERNITY', 'Maternity leave for expectant mothers', 90, 0, NULL, 1, 30, 120, 0, 0, 1, 1, 1, 5, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE code = 'MATERNITY');

-- Paternity Leave
INSERT INTO leave_types (id, name, code, description, defaultDaysPerYear, carryForwardAllowed, maxCarryForwardDays, requiresApproval, minNoticeDays, maxConsecutiveDays, allowHalfDay, prorateForMidYearJoiners, countWeekendsAsLeave, countHolidaysAsLeave, isActive, sortOrder, createdAt, updatedAt)
SELECT UUID(), 'Paternity Leave', 'PATERNITY', 'Leave for new fathers around the birth of their child', 14, 0, NULL, 1, 14, 14, 0, 0, 1, 1, 1, 6, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE code = 'PATERNITY');

-- Unpaid Leave
INSERT INTO leave_types (id, name, code, description, defaultDaysPerYear, carryForwardAllowed, maxCarryForwardDays, requiresApproval, minNoticeDays, maxConsecutiveDays, allowHalfDay, prorateForMidYearJoiners, countWeekendsAsLeave, countHolidaysAsLeave, isActive, sortOrder, createdAt, updatedAt)
SELECT UUID(), 'Unpaid Leave', 'UNPAID', 'Leave without pay for personal reasons', 30, 0, NULL, 1, 14, 30, 0, 0, 1, 1, 1, 7, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM leave_types WHERE code = 'UNPAID');

-- Show results
SELECT 
  name as 'Leave Type',
  code as 'Code',
  defaultDaysPerYear as 'Days/Year',
  sortOrder as 'Order',
  isActive as 'Active'
FROM leave_types
WHERE isActive = 1
ORDER BY sortOrder;
