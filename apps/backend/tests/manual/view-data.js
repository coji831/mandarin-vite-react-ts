import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function viewData() {
  try {
    console.log("📊 Database Contents:\n");

    // Users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, displayName: true, createdAt: true },
    });
    console.log("👥 Users:", users.length);
    users.forEach((u) => console.log(`   - ${u.email} (${u.displayName})`));

    // Vocabulary Words
    const words = await prisma.vocabularyWord.findMany({
      select: { traditional: true, simplified: true, pinyin: true, english: true, level: true },
    });
    console.log("\n📚 Vocabulary Words:", words.length);
    words.forEach((w) =>
      console.log(`   - ${w.traditional} (${w.pinyin}) = ${w.english} [${w.level}]`)
    );

    // Progress
    const progress = await prisma.progress.findMany({
      include: { user: { select: { email: true } } },
    });
    console.log("\n📈 Progress Records:", progress.length);
    progress.forEach((p) => console.log(`   - ${p.user.email}: studied ${p.studyCount} times`));

    console.log("\n✅ Data loaded successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

viewData();
