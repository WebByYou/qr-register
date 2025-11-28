import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    const setting = await prisma.systemSetting.upsert({
      where: {
        key: "qr_settings",
      },
      update: {
        value: JSON.stringify(body),
      },
      create: {
        key: "qr_settings",
        value: JSON.stringify(body),
      },
    });

    return {
      success: true,
      data: JSON.parse(setting.value),
    };
  } catch (error) {
    console.error("Error saving QR settings:", error);
    return {
      success: false,
      message: "Failed to save settings",
    };
  }
});
