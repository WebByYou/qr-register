import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { qrDisplayEmitter } from "../../utils/qr-display";

const prisma = new PrismaClient();

const settingsSchema = z.record(z.any());

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const result = settingsSchema.safeParse(body);

    if (!result.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid settings format",
      });
    }

    const settings = result.data;
    const updates = [];

    // Upsert each setting
    for (const [key, value] of Object.entries(settings)) {
      let stringValue = value;
      if (typeof value === "object") {
        stringValue = JSON.stringify(value);
      } else {
        stringValue = String(value);
      }

      updates.push(
        prisma.systemSetting.upsert({
          where: { key },
          update: { value: stringValue },
          create: { key, value: stringValue },
        })
      );
    }

    await prisma.$transaction(updates);

    // Emit update event for real-time display
    qrDisplayEmitter.emit("update", settings);

    return {
      success: true,
      message: "Settings updated successfully",
    };
  } catch (error) {
    console.error("Error updating settings:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update settings",
    });
  }
});
