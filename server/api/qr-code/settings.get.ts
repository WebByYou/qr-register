import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: {
        key: "qr_settings",
      },
    });

    if (!setting) {
      return {
        success: true,
        data: {
          size: 300,
          color: "#000000",
          bgColor: "#ffffff",
          showOnDisplay: false,
        },
      };
    }

    return {
      success: true,
      data: JSON.parse(setting.value),
    };
  } catch (error) {
    console.error("Error fetching QR settings:", error);
    return {
      success: false,
      message: "Failed to fetch settings",
    };
  }
});
