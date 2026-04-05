import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create test data
  const user = await prisma.user.create({
    data: {
      name: "Test User",
      email: "test_n1@example.com",
      passwordHash: "hash",
      role: "CREATOR",
      jobTitle: "Creator",
      avatarSeed: "seed"
    }
  });

  const items = [];
  for (let i = 0; i < 50; i++) {
    const item = await prisma.contentItem.create({
      data: {
        title: `Test Item ${i}`,
        brief: "brief",
        contentType: "FACEBOOK_POST",
        tone: "PROFESSIONAL",
        channel: "FACEBOOK",
        ownerId: user.id
      }
    });
    items.push({ contentItemId: item.id });
  }

  const start = performance.now();
  for (const item of items) {
    await prisma.contentItem.findUnique({
      where: { id: item.contentItemId },
      select: {
        id: true,
        ownerId: true,
        reviewerId: true,
      },
    });
  }
  const end = performance.now();

  console.log(`Time taken for ${items.length} separate queries: ${(end - start).toFixed(2)}ms`);

  const startOptimized = performance.now();
  await prisma.contentItem.findMany({
    where: {
      id: { in: items.map(item => item.contentItemId) }
    },
    select: {
      id: true,
      ownerId: true,
      reviewerId: true,
    }
  });
  const endOptimized = performance.now();

  console.log(`Time taken for optimized 'in' query: ${(endOptimized - startOptimized).toFixed(2)}ms`);

  // Cleanup
  await prisma.contentItem.deleteMany({
    where: { ownerId: user.id }
  });
  await prisma.user.delete({
    where: { id: user.id }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
