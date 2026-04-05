import { PrismaClient } from '@prisma/client';

// Since we cannot run against a real Postgres without setting it up, we'll mock PrismaClient
// to simulate the N+1 vs batching behavior locally to establish the theoretical performance gain.

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const mockPrisma = {
  contentItem: {
    findUnique: async () => {
      // simulate 5ms latency per query
      await delay(5);
      return { id: "1", ownerId: "user-1", reviewerId: null };
    },
    findMany: async () => {
      // simulate 10ms latency for a batch query
      await delay(10);
      return Array(50).fill({ id: "1", ownerId: "user-1", reviewerId: null });
    }
  }
};

async function main() {
  console.log("Starting Benchmark...");
  const itemsCount = 50;

  const startN1 = performance.now();
  for (let i = 0; i < itemsCount; i++) {
    await mockPrisma.contentItem.findUnique();
  }
  const endN1 = performance.now();

  console.log(`Time taken for ${itemsCount} separate queries (N+1): ${(endN1 - startN1).toFixed(2)}ms`);

  const startOptimized = performance.now();
  await mockPrisma.contentItem.findMany();
  const endOptimized = performance.now();

  console.log(`Time taken for optimized 'in' query: ${(endOptimized - startOptimized).toFixed(2)}ms`);
}

main().catch(console.error);
