-- Check WHEN documents were uploaded - were they uploaded to production or local/dev?

SELECT 
  '📅 Upload Timeline' as info,
  DATE(createdAt) as date,
  COUNT(*) as uploads,
  MIN(createdAt) as first_upload_time,
  MAX(createdAt) as last_upload_time
FROM customer_documents
GROUP BY DATE(createdAt)
ORDER BY date DESC;

-- Check if uploads are very recent (today/yesterday)
SELECT 
  '🕐 Recent Uploads (Last 7 days)' as info,
  c.customerNumber,
  cd.originalName,
  cd.fileKey,
  cd.createdAt,
  TIMESTAMPDIFF(HOUR, cd.createdAt, NOW()) as hours_ago
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
WHERE cd.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY cd.createdAt DESC;

-- Check oldest uploads (might be from local dev)
SELECT 
  '🕰️ Oldest Uploads' as info,
  c.customerNumber,
  cd.originalName,
  cd.fileKey,
  cd.createdAt
FROM customer_documents cd
JOIN customers c ON c.id = cd.customerId
ORDER BY cd.createdAt ASC
LIMIT 10;
