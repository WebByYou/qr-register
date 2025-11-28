import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const settings = await prisma.systemSetting.findMany();

    // Convert array of {key, value} to object
    const settingsObject = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    // Default settings
    const defaultSettings = {
      backgroundImage: "",
      qrPosition: JSON.stringify({ x: 300, y: 150 }),
      qrSize: "300",
      title: "Lucky Draw",
      subtitle: "ลุ้นรับรางวัลใหญ่",
      waitText: "รอลุ้นรางวัล...",
    };

    // Merge defaults with stored settings
    const rawSettings = { ...defaultSettings, ...settingsObject };

    const finalSettings: any = { ...rawSettings };

    // Parse JSON fields if needed (qrPosition is stored as string but used as object in frontend sometimes,
    // but based on previous code it seems it might be expected as object.
    // Let's check how it was used. The original code read from JSON file where it was likely an object.
    // Prisma stores strings. So we need to parse qrPosition if it's a string.

    try {
      if (typeof finalSettings.qrPosition === "string") {
        finalSettings.qrPosition = JSON.parse(finalSettings.qrPosition);
      }
    } catch (e) {
      finalSettings.qrPosition = { x: 300, y: 150 };
    }

    // Ensure qrSize is number
    finalSettings.qrSize = Number(finalSettings.qrSize);

    return {
      success: true,
      data: finalSettings,
    };
  } catch (error) {
    console.error("Error reading QR display settings:", error);

    // Return default settings if error
    return {
      success: true,
      data: {
        backgroundImage: "",
        qrPosition: { x: 300, y: 150 },
        qrSize: 300,
        title: "Lucky Draw",
        subtitle: "ลุ้นรับรางวัลใหญ่",
        waitText: "รอลุ้นรางวัล...",
      },
    };
  }
});
