import { PrismaClient, OrgRole, LeadStatus, DealStage } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: 'stackvolt-demo' },
    update: {},
    create: { name: 'StackVolt Demo Co.', slug: 'stackvolt-demo' },
  });

  const passwordHash = await bcrypt.hash('Demo1234!', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@aitellion.dev' },
    update: {},
    create: {
      email: 'owner@aitellion.dev',
      fullName: 'Demo Owner',
      passwordHash,
      isEmailVerified: true,
    },
  });

  await prisma.orgMembership.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: owner.id } },
    update: {},
    create: { organizationId: org.id, userId: owner.id, role: OrgRole.OWNER },
  });

  const pipeline = await prisma.pipeline.upsert({
    where: { id: 'seed-pipeline' }, // will fail unique lookup gracefully; use findFirst fallback below
    update: {},
    create: { id: 'seed-pipeline', organizationId: org.id, name: 'Sales Pipeline', isDefault: true },
  }).catch(async () => {
    const existing = await prisma.pipeline.findFirst({ where: { organizationId: org.id, isDefault: true } });
    if (existing) return existing;
    return prisma.pipeline.create({ data: { organizationId: org.id, name: 'Sales Pipeline', isDefault: true } });
  });

  const customer = await prisma.customer.create({
    data: {
      organizationId: org.id,
      name: 'Rohan Mehta',
      company: 'Mehta Textiles',
      email: 'rohan@mehtatextiles.example',
      phone: '+91 98765 43210',
      tags: ['textiles', 'wholesale'],
    },
  });

  await prisma.deal.create({
    data: {
      organizationId: org.id,
      pipelineId: pipeline.id,
      customerId: customer.id,
      title: 'Annual fabric supply contract',
      valueCents: 1_250_000,
      stage: DealStage.PROPOSAL,
      probability: 60,
      ownerId: owner.id,
    },
  });

  await prisma.lead.create({
    data: {
      organizationId: org.id,
      name: 'Priya Sharma',
      company: 'Sharma Retail Group',
      email: 'priya@sharmaretail.example',
      source: 'Website',
      status: LeadStatus.NEW,
      ownerId: owner.id,
    },
  });

  console.log('Seed complete.');
  console.log('Login with: owner@aitellion.dev / Demo1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
