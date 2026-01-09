/**
 * @file apps/backend/tests/database.test.js
 * @description Tests for Prisma database client and basic CRUD operations
 */

import { prisma } from "../src/infrastructure/database/client.js";
import bcrypt from "bcrypt";

describe("Database Client", () => {
  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: "test-jest" } },
    });
    await prisma.$disconnect();
  });

  test("Prisma client connects successfully", async () => {
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    expect(result).toBeTruthy();
  });

  test("Can create a user", async () => {
    const email = `test-jest-${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash("TestPassword123!", 10),
        displayName: "Jest Test User",
      },
    });

    expect(user.id).toBeTruthy();
    expect(user.email).toBe(email);
    expect(user.displayName).toBe("Jest Test User");
  });

  test("Enforces unique email constraint", async () => {
    const email = `test-jest-unique-${Date.now()}@example.com`;

    await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash("TestPassword123!", 10),
      },
    });

    await expect(
      prisma.user.create({
        data: {
          email, // Same email
          passwordHash: await bcrypt.hash("TestPassword123!", 10),
        },
      })
    ).rejects.toThrow();
  });

  test("Can create progress with userId + wordId unique constraint", async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-jest-progress-${Date.now()}@example.com`,
        passwordHash: await bcrypt.hash("Test123!", 10),
      },
    });

    const word = await prisma.vocabularyWord.create({
      data: {
        traditional: "測試",
        simplified: "测试",
        pinyin: "cè shì",
        english: "test",
        level: "HSK3",
      },
    });

    const progress1 = await prisma.progress.create({
      data: {
        userId: user.id,
        wordId: word.id,
        studyCount: 1,
      },
    });

    expect(progress1).toBeTruthy();

    // Duplicate userId + wordId should fail
    await expect(
      prisma.progress.create({
        data: {
          userId: user.id,
          wordId: word.id,
          studyCount: 2,
        },
      })
    ).rejects.toThrow();
  });
});
