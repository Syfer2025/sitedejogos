import { prisma } from './src/lib/prisma';
prisma.game.count().then(console.log).catch(console.error).finally(() => prisma.$disconnect());
