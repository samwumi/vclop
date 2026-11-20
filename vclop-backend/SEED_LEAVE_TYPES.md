# Seed Leave Types - Using Prisma

## Quick Start

Run this command in the `vclop-backend` directory:

```bash
npm run seed:leave-types
```

That's it! The script will:
1. ✅ Check if leave types already exist (won't create duplicates)
2. ✅ Create 7 leave types with proper configuration
3. ✅ Display a summary of all active leave types

## What Gets Created

| Leave Type | Code | Days/Year | Can Carry Forward | Description |
|------------|------|-----------|-------------------|-------------|
| Annual Leave | ANNUAL | 21 | Yes (5 days) | Regular vacation |
| Sick Leave | SICK | 12 | Yes (6 days) | Medical illness |
| Compassionate Leave | COMPASSIONATE | 5 | No | Family emergencies |
| Education/Study Leave | EDUCATION | 10 | Yes (5 days) | Training & exams |
| Maternity Leave | MATERNITY | 90 | No | Expectant mothers |
| Paternity Leave | PATERNITY | 14 | No | New fathers |
| Unpaid Leave | UNPAID | 30 | No | Leave without pay |

## Expected Output

```
🌱 Seeding leave types...
✓ Created Annual Leave (ANNUAL) - 21 days/year
✓ Created Sick Leave (SICK) - 12 days/year
✓ Created Compassionate Leave (COMPASSIONATE) - 5 days/year
✓ Created Education/Study Leave (EDUCATION) - 10 days/year
✓ Created Maternity Leave (MATERNITY) - 90 days/year
✓ Created Paternity Leave (PATERNITY) - 14 days/year
✓ Created Unpaid Leave (UNPAID) - 30 days/year

✅ Leave types seeded successfully!

📋 Active Leave Types:
────────────────────────────────────────────────────
1. Annual Leave (ANNUAL) - 21 days/year
2. Sick Leave (SICK) - 12 days/year
3. Compassionate Leave (COMPASSIONATE) - 5 days/year
4. Education/Study Leave (EDUCATION) - 10 days/year
5. Maternity Leave (MATERNITY) - 90 days/year
6. Paternity Leave (PATERNITY) - 14 days/year
7. Unpaid Leave (UNPAID) - 30 days/year
────────────────────────────────────────────────────
```

## After Seeding

1. **Refresh your leave application page**
2. **Click the "Leave Type" dropdown**
3. **You'll see all 7 options!** ✅

## Running Multiple Times

The script is safe to run multiple times. It checks if each leave type exists before creating it:

```
✓ Annual Leave (ANNUAL) already exists
✓ Sick Leave (SICK) already exists
...
```

## Troubleshooting

### "Cannot find module" error
Make sure you're in the `vclop-backend` directory:
```bash
cd vclop/vclop-backend
npm run seed:leave-types
```

### Database connection error
Check your `.env` file has the correct `DATABASE_URL`:
```
DATABASE_URL="mysql://user:password@host:3306/database"
```

### Permission denied
Make sure your database user has INSERT permissions on the `leave_types` table.

## Alternative: Run the TypeScript file directly

```bash
cd vclop/vclop-backend
npx ts-node --transpile-only src/scripts/seed-leave-types.ts
```

## Files

- **Script**: `src/scripts/seed-leave-types.ts`
- **Package script**: `npm run seed:leave-types` (defined in package.json)

---

**Next Step**: After running this script, refresh your leave application page and the dropdown will be populated!
