const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Initialize Prisma 7 adapter
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seed...');

  // Load the extracted mock database JSON
  const dbPath = path.join(__dirname, '../scratch/mock_db.json');
  if (!fs.existsSync(dbPath)) {
    throw new Error(`Mock database file not found at ${dbPath}. Run extraction script first.`);
  }
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  console.log(`Loaded mock DB: ${db.users.length} users, ${db.leads.length} leads, ${db.targets.length} targets.`);

  // Generate password hash
  const passwordHash = await bcrypt.hash('password123', 10);
  console.log('Generated default user password hash (password: "password123")');

  // Clear existing data (in reverse order of dependencies)
  console.log('Clearing old data...');
  await prisma.target.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Users
  console.log('Seeding users...');
  for (const user of db.users) {
    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: passwordHash,
        role: user.role, // role maps to Role enum (ADMIN, MANAGER, SALES)
        active: user.active,
        designation: user.designation,
      }
    });
  }
  console.log(`Seeding users complete.`);

  // 2. Seed Targets
  console.log('Seeding targets...');
  for (const target of db.targets) {
    await prisma.target.create({
      data: {
        staffId: target.staffId,
        leadTarget: target.leadTarget,
        followUpTarget: target.followUpTarget,
        meetingTarget: target.meetingTarget,
        conversionTarget: target.conversionTarget,
        revenueTarget: target.revenueTarget,
      }
    });
  }
  console.log(`Seeding targets complete.`);

  // 3. Seed Leads & Activities
  console.log('Seeding leads & activities...');
  let activityCount = 0;
  for (const lead of db.leads) {
    // Determine assigned user id
    const assignedToId = lead.assignedTo ? lead.assignedTo.id : null;

    // Create the lead
    await prisma.lead.create({
      data: {
        id: lead.id,
        organizationName: lead.organizationName,
        contactName: lead.contactName,
        designation: lead.designation,
        phone: lead.phone,
        email: lead.email,
        province: lead.province,
        district: lead.district,
        source: lead.source,
        leadType: lead.leadType,
        dateAdded: new Date(lead.dateAdded),
        priority: lead.priority || 'MEDIUM',
        status: lead.status || 'NEW_LEAD',
        nextActionDate: lead.nextActionDate ? new Date(lead.nextActionDate) : null,
        notes: lead.notes,
        assignedToId: assignedToId,
      }
    });

    // Create activities for this lead
    if (lead.activities && Array.isArray(lead.activities)) {
      for (const act of lead.activities) {
        await prisma.activity.create({
          data: {
            id: act.id,
            type: act.type,
            occurredAt: new Date(act.occurredAt),
            remarks: act.remarks,
            leadId: lead.id,
            createdById: act.createdBy.id,
          }
        });
        activityCount++;
      }
    }
  }
  console.log(`Seeding leads complete. Created ${db.leads.length} leads and ${activityCount} activities.`);

  // 4. Sync PostgreSQL Serial Sequence Counters
  // Since we inserted explicit IDs, we must adjust sequence numbers so future autoincrements don't crash.
  console.log('Syncing sequence counters in PostgreSQL...');
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"User"', 'id'), coalesce(max(id), 1)) FROM "User";`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Lead"', 'id'), coalesce(max(id), 1)) FROM "Lead";`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Activity"', 'id'), coalesce(max(id), 1)) FROM "Activity";`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Target"', 'id'), coalesce(max(id), 1)) FROM "Target";`);
  console.log('Sequences synced successfully.');

  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
