import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { key: "qrSize" },
    });
    console.log("QR Size in DB:");
    console.log(JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error("Error querying database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
