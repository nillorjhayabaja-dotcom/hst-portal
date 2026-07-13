import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const MODULES = [
  'employees',
  'departments',
  'roles',
  'permissions',
  'workflow',
  'approval',
  'notifications',
  'audit',
  'attachments',
  'gate-pass',
  'leave',
  'mrf',
  'purchase',
  'visitors',
  'vehicles',
  'assets',
  'all',
];

const FULL_ACTIONS = ['create', 'view', 'edit', 'delete', 'approve', 'export', 'full'];

async function main() {
  console.log('Seeding database...');

  // Roles
  const superAdmin = await prisma.role.upsert({
    where: { id: 'super_admin' },
    update: {},
    create: {
      id: 'super_admin',
      name: 'Super Admin',
      shortName: 'SA',
      level: 1,
      description: 'Full system access',
    },
  });
  const admin = await prisma.role.upsert({
    where: { id: 'admin' },
    update: {},
    create: {
      id: 'admin',
      name: 'Administrator',
      shortName: 'ADM',
      level: 2,
      description: 'Administrative access',
    },
  });
  const manager = await prisma.role.upsert({
    where: { id: 'manager' },
    update: {},
    create: {
      id: 'manager',
      name: 'Manager',
      shortName: 'MGR',
      level: 4,
      description: 'Department manager',
    },
  });
  const supervisor = await prisma.role.upsert({
    where: { id: 'supervisor' },
    update: {},
    create: {
      id: 'supervisor',
      name: 'Supervisor',
      shortName: 'SUP',
      level: 5,
      description: 'Department supervisor - provides recommendation',
    },
  });
  const gad = await prisma.role.upsert({
    where: { id: 'gad' },
    update: {},
    create: {
      id: 'gad',
      name: 'GAD',
      shortName: 'GAD',
      level: 3,
      description: 'General Administration Department - final approval',
    },
  });
  const security = await prisma.role.upsert({
    where: { id: 'security' },
    update: {},
    create: {
      id: 'security',
      name: 'Security',
      shortName: 'SEC',
      level: 8,
      description: 'Security personnel - gate pass release',
    },
  });
  const employee = await prisma.role.upsert({
    where: { id: 'employee' },
    update: {},
    create: {
      id: 'employee',
      name: 'Employee',
      shortName: 'EMP',
      level: 9,
      description: 'Standard employee',
    },
  });

  // Permissions: super_admin gets full on all modules
  await prisma.permission.deleteMany({ where: { roleId: superAdmin.id } });
  await prisma.permission.createMany({
    data: MODULES.map((m) => ({
      roleId: superAdmin.id,
      moduleId: m,
      actions: FULL_ACTIONS,
      scope: 'all',
    })),
  });

  // Permissions: supervisor role
  await prisma.permission.deleteMany({ where: { roleId: supervisor.id } });
  await prisma.permission.createMany({
    data: [
      { roleId: supervisor.id, moduleId: 'employees', actions: ['view'], scope: 'own' },
      {
        roleId: supervisor.id,
        moduleId: 'gate-pass',
        actions: ['create', 'view', 'edit', 'approve'],
        scope: 'department',
      },
    ],
  });

  // Permissions: manager role
  await prisma.permission.deleteMany({ where: { roleId: manager.id } });
  await prisma.permission.createMany({
    data: [
      { roleId: manager.id, moduleId: 'employees', actions: ['view'], scope: 'department' },
      {
        roleId: manager.id,
        moduleId: 'gate-pass',
        actions: ['create', 'view', 'edit', 'approve'],
        scope: 'department',
      },
      { roleId: manager.id, moduleId: 'leave', actions: ['create', 'view', 'approve'], scope: 'department' },
    ],
  });

  // Permissions: admin role
  await prisma.permission.deleteMany({ where: { roleId: admin.id } });
  await prisma.permission.createMany({
    data: [
      {
        roleId: admin.id,
        moduleId: 'gate-pass',
        actions: ['create', 'view', 'edit', 'approve'],
        scope: 'all',
      },
    ],
  });

  // Permissions: GAD role
  await prisma.permission.deleteMany({ where: { roleId: gad.id } });
  await prisma.permission.createMany({
    data: [
      {
        roleId: gad.id,
        moduleId: 'gate-pass',
        actions: ['view', 'approve'],
        scope: 'all',
      },
    ],
  });

  // Permissions: Security role
  await prisma.permission.deleteMany({ where: { roleId: security.id } });
  await prisma.permission.createMany({
    data: [
      {
        roleId: security.id,
        moduleId: 'gate-pass',
        actions: ['view', 'edit'],
        scope: 'all',
      },
    ],
  });

  // Permissions: employee role
  await prisma.permission.deleteMany({ where: { roleId: employee.id } });
  await prisma.permission.createMany({
    data: [
      { roleId: employee.id, moduleId: 'employees', actions: ['view'], scope: 'own' },
      {
        roleId: employee.id,
        moduleId: 'gate-pass',
        actions: ['create', 'view', 'edit'],
        scope: 'own',
      },
      { roleId: employee.id, moduleId: 'leave', actions: ['create', 'view', 'edit'], scope: 'own' },
    ],
  });

  // Department
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

  // Super admin user
  const passwordHash = await bcrypt.hash('Admin@12345', 12);
  const user = await prisma.user.upsert({
    where: { employeeId: 'HS0001-0001' },
    update: { passwordHash },
    create: {
      employeeId: 'HS0001-0001',
      email: 'admin@hst-corp.com',
      passwordHash,
      displayName: 'System Administrator',
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: superAdmin.id } },
    update: {},
    create: { userId: user.id, roleId: superAdmin.id },
  });

  // Employee record for the admin
  await prisma.employee.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      employeeNumber: 'HS0001-0001',
      userId: user.id,
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@hst-corp.com',
      departmentId: dept.id,
      hireDate: new Date('2024-01-01'),
      status: 'active',
    },
  });

  // Workflow definitions for modules
  const gatePassWorkflow = await prisma.workflow.upsert({
    where: { id: 'wf-gate-pass' },
    update: {},
    create: {
      id: 'wf-gate-pass',
      moduleId: 'gate-pass',
      name: 'Gate Pass Approval',
      description: 'Standard gate pass approval workflow',
      isActive: true,
    },
  });

  await prisma.workflowStep.deleteMany({ where: { workflowId: gatePassWorkflow.id } });
  await prisma.workflowStep.createMany({
    data: [
      {
        workflowId: gatePassWorkflow.id,
        name: 'Recommendation',
        roleId: 'supervisor',
        stepOrder: 1,
        isRequired: true,
        label: 'Supervisor Recommendation',
        description: 'Supervisor reviews and recommends the gate pass',
        autoApprove: false,
      },
      {
        workflowId: gatePassWorkflow.id,
        name: 'Noted By',
        roleId: 'admin',
        stepOrder: 2,
        isRequired: true,
        label: 'Administrator / Car Assignee',
        description: 'Administrator notes and assigns vehicle',
        autoApprove: false,
        conditionField: 'needsManagerNoted',
        conditionOperator: 'neq',
        conditionValue: 'false',
      },
      {
        workflowId: gatePassWorkflow.id,
        name: 'GAD Approval',
        roleId: 'gad',
        stepOrder: 3,
        isRequired: true,
        label: 'General Administration Approval',
        description: 'GAD final approval - QR code generated after this',
        autoApprove: false,
      },
    ],
  });

  // Vehicles seed (needed for gate-pass plateNumber lookups)
  await prisma.vehicle.upsert({
    where: { plateNumber: 'ABC-1234' },
    update: {},
    create: {
      plateNumber: 'ABC-1234',
      brand: 'Demo',
      model: 'Vehicle',
      year: 2020,
      color: 'White',
      vehicleType: 'company_vehicle',
      status: 'available',
    },
  });

  // Control number series for modules
  const series = [

    {
      moduleId: 'gate-pass',
      prefix: 'GP',
      separator: '-',
      includeYear: true,
      includeMonth: false,
      sequenceLength: 5,
      formatPattern: '{PREFIX}-{YEAR}-{SEQ}',
    },
    {
      moduleId: 'leave',
      prefix: 'LV',
      separator: '-',
      includeYear: true,
      includeMonth: false,
      sequenceLength: 5,
      formatPattern: '{PREFIX}-{YEAR}-{SEQ}',
    },
    {
      moduleId: 'mrf',
      prefix: 'MRF',
      separator: '-',
      includeYear: true,
      includeMonth: false,
      sequenceLength: 5,
      formatPattern: '{PREFIX}-{YEAR}-{SEQ}',
    },
    {
      moduleId: 'purchase',
      prefix: 'PR',
      separator: '-',
      includeYear: true,
      includeMonth: false,
      sequenceLength: 5,
      formatPattern: '{PREFIX}-{YEAR}-{SEQ}',
    },
  ];
  for (const s of series) {
    await prisma.controlNumberSeries.upsert({
      where: { moduleId: s.moduleId },
      update: {},
      create: { ...s, nextSequence: 1, isActive: true },
    });
  }

  console.log('Seed complete. Admin login: HS0001-0001 / Admin@12345');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
