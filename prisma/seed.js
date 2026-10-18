const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Ensuring Superadmin account exists...');

  const superadminHash = await bcrypt.hash('superadmin@123', 10);

  // 1. Upsert Superadmin (superadmin / superadmin@123)
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@platform.com' },
    update: {
      name: 'Global Platform Director',
      passwordHash: superadminHash,
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      firstLogin: false,
    },
    create: {
      name: 'Global Platform Director',
      email: 'superadmin@platform.com',
      passwordHash: superadminHash,
      role: 'SUPERADMIN',
      status: 'ACTIVE',
      firstLogin: false,
    },
  });

  console.log('✅ Superadmin account verified:', superadmin.email);

  // 2. Remove legacy demo stores and related data
  const demoSlugs = ['aura-living', 'urban-pulse', 'sterling-botanicals'];
  const demoStores = await prisma.store.findMany({
    where: { slug: { in: demoSlugs } },
    select: { id: true },
  });
  const demoStoreIds = demoStores.map((s) => s.id);

  if (demoStoreIds.length > 0) {
    console.log(`🧹 Removing ${demoStoreIds.length} demo stores and their associated records...`);
    
    // Clear order items for demo orders
    await prisma.orderItem.deleteMany({
      where: { order: { storeId: { in: demoStoreIds } } },
    });

    // Clear demo orders
    await prisma.order.deleteMany({
      where: { storeId: { in: demoStoreIds } },
    });

    // Clear demo products
    await prisma.product.deleteMany({
      where: { storeId: { in: demoStoreIds } },
    });

    // Clear demo categories
    await prisma.category.deleteMany({
      where: { storeId: { in: demoStoreIds } },
    });

    // Clear demo stores
    await prisma.store.deleteMany({
      where: { id: { in: demoStoreIds } },
    });
  }

  // 3. Remove demo users (merchants & mock customers)
  const demoEmails = [
    'artisan@store.com',
    'tech@urbanpulse.io',
    'newpartner@store.com',
    'sophia@customer.com',
    'david@customer.com',
    'liam@customer.com',
    'chloe@customer.com',
    'elena@customer.com',
  ];

  const deletedUsers = await prisma.user.deleteMany({
    where: { email: { in: demoEmails } },
  });

  console.log(`🧹 Cleaned up ${deletedUsers.count} demo user accounts.`);
  console.log('🎉 Production clean complete! Only user-created data and Superadmin are present.');
}

main()
  .catch((e) => {
    console.error('❌ Error during database clean/seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
