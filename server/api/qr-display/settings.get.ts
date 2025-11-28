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
      titlePosition: JSON.stringify({ x: 960, y: 540 }), // Default center
      subtitlePosition: JSON.stringify({ x: 960, y: 600 }), // Default below title
      countPosition: JSON.stringify({ x: 960, y: 660 }), // Default below subtitle
      qrSize: "300",
      title: "Lucky Draw",
      subtitle: "ลุ้นรับรางวัลใหญ่",
      showCount: "false",
    };

    // Merge defaults with stored settings
    const rawSettings = { ...defaultSettings, ...settingsObject };

    const finalSettings: any = { ...rawSettings };

    // Parse JSON fields
    const jsonFields = [
      "qrPosition",
      "titlePosition",
      "subtitlePosition",
      "countPosition",
    ];
    jsonFields.forEach((field) => {
      try {
        if (typeof finalSettings[field] === "string") {
          finalSettings[field] = JSON.parse(finalSettings[field]);
        }
      } catch (e) {
        // Fallback defaults if parse fails
        if (field === "qrPosition") finalSettings[field] = { x: 300, y: 150 };
        if (field === "titlePosition")
          finalSettings[field] = { x: 960, y: 540 };
        if (field === "subtitlePosition")
          finalSettings[field] = { x: 960, y: 600 };
        if (field === "countPosition")
          finalSettings[field] = { x: 960, y: 660 };
      }
    });

    // Ensure qrSize is number
    finalSettings.qrSize = Number(finalSettings.qrSize);

    // Ensure showCount is boolean
    finalSettings.showCount = finalSettings.showCount === "true";

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
        showCount: false,
      },
    };
  }
});
