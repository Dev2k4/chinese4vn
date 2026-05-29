import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("test123456", 10);
  const user = await prisma.user.upsert({
    where: { email: "test@chinese4vn.com" },
    update: {},
    create: {
      email: "test@chinese4vn.com",
      username: "testuser",
      displayName: "Test User",
      password,
      nativeLanguage: "vi",
      targetLanguage: "zh",
      onboardingCompleted: true,
      isEmailVerified: true,
      isActive: true,
    },
  });
  console.log("Test user created:", user.email, "/ test123456");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
