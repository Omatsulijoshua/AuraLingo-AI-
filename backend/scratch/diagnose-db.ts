import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('--- DIAGNOSING PLANS AND SUBSCRIPTIONS ---');
  const plans = await prisma.subscriptionPlan.findMany();
  console.log('Plans:', JSON.stringify(plans, null, 2));

  const subs = await prisma.subscription.findMany({
    include: { plan: true, user: true }
  });
  console.log('Active Subscriptions:', JSON.stringify(subs, null, 2));

  const users = await prisma.user.findMany();
  console.log('Users:', JSON.stringify(users.map(u => ({ id: u.id, email: u.email, role: u.role })), null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
