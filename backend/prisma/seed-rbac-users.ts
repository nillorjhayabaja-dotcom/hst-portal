import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const USERS: Array<{
  employeeId: string;
  roleId: string;
  email: string;
  displayName: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
}> = [
  {
    employeeId: 'HS0001-0002',
    roleId: 'admin',
    email: 'admin2@hst-corp.com',
    displayName: 'Administrator',
    employeeNumber: 'HS0001-0002',
    firstName: 'System',
    lastName: 'Administrator2',
  },
  {
    employeeId: 'HS0001-0003',
    roleId: 'manager',
    email: 'executive@hst-corp.com',
    displayName: 'Executive',
    employeeNumber: 'HS0001-0003',
    firstName: 'System',
    lastName: 'Executive',
  },
  {
    employeeId: 'HS0001-0004',
    roleId: 'manager',
    email: 'manager@hst-corp.com',
    displayName: 'Manager',
    employeeNumber: 'HS0001-0004',
    firstName: 'System',
    lastName: 'Manager',
  },
  {
    employeeId: 'HS0001-0005',
    roleId: 'supervisor',
    email: 'supervisor@hst-corp.com',
    displayName: 'Supervisor',
    employeeNumber: 'HS0001-0005',
    firstName: 'System',
    lastName: 'Supervisor',
  },
  {
    employeeId: 'HS0001-0006',
    roleId: 'employee',
    email: 'hr@hst-corp.com',
    displayName: 'HR',
    employeeNumber: 'HS0001-0006',
    firstName: 'System',
    lastName: 'HR',
  },
  {
    employeeId: 'HS0001-0007',
    roleId: 'gad',
    email: 'gad@hst-corp.com',
    displayName: 'GAD',
    employeeNumber: 'HS0001-0007',
    firstName: 'System',
    lastName: 'GAD',
  },
  {
    employeeId: 'HS0001-0008',
    roleId: 'security',
    email: 'security@hst-corp.com',
    displayName: 'Security',
    employeeNumber: 'HS0001-0008',
    firstName: 'System',
    lastName: 'Security',
  },
  {
    employeeId: 'HS0001-0009',
    roleId: 'employee',
    email: 'employee@hst-corp.com',
    displayName: 'Employee',
    employeeNumber: 'HS0001-0009',
    firstName: 'System',
    lastName: 'Employee',
  },
];

async function main() {
  const passwordHash = await bcrypt.hash('Admin@12345', 12);
  const dept = await prisma.department.upsert({
    where: { code: 'HQ' },
    update: {},
    create: {
      name: 'Headquarters',
      code: 'HQ',
      level: 1,
      sortOrder: 1,
      description: 'Main office',
    },
  });

  // Ensure roles exist (best-effort)
  const roleIds = Array.from(new Set(USERS.map((u) => u.roleId)));
  for (const roleId of roleIds) {
    // create with sensible defaults if missing
    await prisma.role.upsert({
      where: { id: roleId },
      update: {},
      create: {
        id: roleId,
        name: roleId,
        shortName: roleId.slice(0, 3).toUpperCase(),
        level: roleId === 'admin' ? 2 : roleId === 'manager' ? 4 : 9,
        description: 'Seed role',
      },
    });
  }

  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { employeeId: u.employeeId },
      update: { passwordHash },
      create: {
        employeeId: u.employeeId,
        email: u.email,
        passwordHash,
        displayName: u.displayName,
        isActive: true,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: u.roleId } },
      update: {},
      create: { userId: user.id, roleId: u.roleId },
    });

    await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        employeeNumber: u.employeeNumber,
        userId: user.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        departmentId: dept.id,
        hireDate: new Date('2024-01-01'),
        status: 'active',
      },
    });
  }

  console.log('Seed complete. RBAC test users added/updated with Admin@12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
