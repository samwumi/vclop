-- ONE LINE FIX: Copy and run this in your database
UPDATE employment_periods SET isCurrent = 1, terminationDate = NULL WHERE userId = (SELECT id FROM users WHERE email = 'samwumi@gmail.com') ORDER BY createdAt DESC LIMIT 1;
