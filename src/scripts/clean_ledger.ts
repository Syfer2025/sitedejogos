import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.coinTransaction.deleteMany({
    where: {
      reason: {
        in: ['daily_login', 'streak_3', 'streak_7', 'streak_14', 'streak_30', 'mission_complete', 'achievement_unlock', 'blog_read']
      }
    }
  });
  console.log(`Deleted ${deleted.count} legacy gamification transactions from the coin ledger.`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
