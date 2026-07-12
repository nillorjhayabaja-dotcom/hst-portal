import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running master seed...');
  
  // Import and run the main seed
  console.log('Running main seed (roles, permissions, admin user)...');
  await import('./seed.ts');
  
  // Import and run RBAC users seed
  console.log('Running RBAC users seed (all test users)...');
  await import('./seed-rbac-users.ts');
  
  console.log('Master seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });