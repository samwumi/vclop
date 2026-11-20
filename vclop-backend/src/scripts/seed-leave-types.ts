import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const leaveTypes = [
  {
    name: 'Annual Leave',
    code: 'ANNUAL',
    description: 'Regular annual vacation leave',
    defaultDaysPerYear: 21,
    carryForwardAllowed: true,
    maxCarryForwardDays: 5,
    requiresApproval: true,
    minNoticeDays: 7,
    maxConsecutiveDays: 14,
    allowHalfDay: true,
    prorateForMidYearJoiners: true,
    countWeekendsAsLeave: false,
    countHolidaysAsLeave: false,
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'Sick Leave',
    code: 'SICK',
    description: 'Leave for illness or medical reasons (medical certificate may be required for >3 days)',
    defaultDaysPerYear: 12,
    carryForwardAllowed: true,
    maxCarryForwardDays: 6,
    requiresApproval: true,
    minNoticeDays: 0,
    maxConsecutiveDays: 14,
    allowHalfDay: true,
    prorateForMidYearJoiners: true,
    countWeekendsAsLeave: false,
    countHolidaysAsLeave: false,
    isActive: true,
    sortOrder: 2,
  },
  {
    name: 'Compassionate Leave',
    code: 'COMPASSIONATE',
    description: 'Leave for family emergencies, bereavement, or serious illness of immediate family members',
    defaultDaysPerYear: 5,
    carryForwardAllowed: false,
    maxCarryForwardDays: null,
    requiresApproval: true,
    minNoticeDays: 0,
    maxConsecutiveDays: 5,
    allowHalfDay: false,
    prorateForMidYearJoiners: true,
    countWeekendsAsLeave: false,
    countHolidaysAsLeave: false,
    isActive: true,
    sortOrder: 3,
  },
  {
    name: 'Education/Study Leave',
    code: 'EDUCATION',
    description: 'Leave for attending courses, training, examinations, or professional development',
    defaultDaysPerYear: 10,
    carryForwardAllowed: true,
    maxCarryForwardDays: 5,
    requiresApproval: true,
    minNoticeDays: 14,
    maxConsecutiveDays: 10,
    allowHalfDay: true,
    prorateForMidYearJoiners: true,
    countWeekendsAsLeave: false,
    countHolidaysAsLeave: false,
    isActive: true,
    sortOrder: 4,
  },
  {
    name: 'Maternity Leave',
    code: 'MATERNITY',
    description: 'Maternity leave for expectant mothers (typically 90-120 days based on policy)',
    defaultDaysPerYear: 90,
    carryForwardAllowed: false,
    maxCarryForwardDays: null,
    requiresApproval: true,
    minNoticeDays: 30,
    maxConsecutiveDays: 120,
    allowHalfDay: false,
    prorateForMidYearJoiners: false,
    countWeekendsAsLeave: true,
    countHolidaysAsLeave: true,
    isActive: true,
    sortOrder: 5,
  },
  {
    name: 'Paternity Leave',
    code: 'PATERNITY',
    description: 'Leave for new fathers around the birth of their child',
    defaultDaysPerYear: 14,
    carryForwardAllowed: false,
    maxCarryForwardDays: null,
    requiresApproval: true,
    minNoticeDays: 14,
    maxConsecutiveDays: 14,
    allowHalfDay: false,
    prorateForMidYearJoiners: false,
    countWeekendsAsLeave: true,
    countHolidaysAsLeave: true,
    isActive: true,
    sortOrder: 6,
  },
  {
    name: 'Unpaid Leave',
    code: 'UNPAID',
    description: 'Leave without pay for personal reasons after exhausting other leave types',
    defaultDaysPerYear: 30,
    carryForwardAllowed: false,
    maxCarryForwardDays: null,
    requiresApproval: true,
    minNoticeDays: 14,
    maxConsecutiveDays: 30,
    allowHalfDay: false,
    prorateForMidYearJoiners: false,
    countWeekendsAsLeave: true,
    countHolidaysAsLeave: true,
    isActive: true,
    sortOrder: 7,
  },
];

async function seedLeaveTypes() {
  console.log('🌱 Seeding leave types...');

  for (const leaveType of leaveTypes) {
    // Check if leave type already exists
    const existing = await prisma.leaveType.findUnique({
      where: { code: leaveType.code },
    });

    if (existing) {
      console.log(`✓ ${leaveType.name} (${leaveType.code}) already exists`);
      continue;
    }

    // Create leave type
    await prisma.leaveType.create({
      data: leaveType,
    });

    console.log(`✓ Created ${leaveType.name} (${leaveType.code}) - ${leaveType.defaultDaysPerYear} days/year`);
  }

  console.log('\n✅ Leave types seeded successfully!');

  // Display all leave types
  const allLeaveTypes = await prisma.leaveType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  console.log('\n📋 Active Leave Types:');
  console.log('────────────────────────────────────────────────────');
  allLeaveTypes.forEach((lt) => {
    console.log(`${lt.sortOrder}. ${lt.name} (${lt.code}) - ${lt.defaultDaysPerYear} days/year`);
  });
  console.log('────────────────────────────────────────────────────');
}

// Run the seed
seedLeaveTypes()
  .catch((error) => {
    console.error('❌ Error seeding leave types:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
