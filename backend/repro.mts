import { prisma } from './src/infrastructure/database/prisma.service';

const requestId = 'af88bc9c-41e9-4e15-8566-c477809a77fa';

async function main() {
  try {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: {
        gatePass: true,
        workflow: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' },
              include: { role: true },
            },
          },
        },
        steps: {
          orderBy: { stepOrder: 'asc' },
          include: {
            actor: { select: { id: true, displayName: true, signaturePath: true } },
            role: true,
          },
        },
        actions: {
          orderBy: { createdAt: 'asc' },
          include: {
            actor: { select: { id: true, displayName: true } },
          },
        },
      },
    });
    console.log('RESULT:', JSON.stringify(request, null, 2)?.slice(0, 500));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();