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

    // Also update qrSize for display settings to keep them in sync
    if (body.size) {
      await prisma.systemSetting.upsert({
        where: { key: "qrSize" },
        update: { value: String(body.size) },
        create: { key: "qrSize", value: String(body.size) },
      });

      // Emit update event for display
      const { qrDisplayEmitter } = await import("../../utils/qr-display");
      qrDisplayEmitter.emit("update", { qrSize: Number(body.size) });
    }

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
