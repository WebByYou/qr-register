import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const settings = await prisma.systemSetting.findMany();

    // Transform array to object { key: value }
    const settingsObject = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return {
      success: true,
      data: settingsObject,
    };
  } catch (error) {
    console.error("Error fetching settings:", error);
    return {
      success: false,
      data: {},
    };
  }
});
