import { PrismaClient } from "@prisma/client";
import { qrDisplayEmitter } from "../../utils/qr-display";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Prepare settings to save
    const settingsToSave = [
      { key: "backgroundImage", value: body.backgroundImage || "" },
      {
        key: "qrPosition",
        value: JSON.stringify(body.qrPosition || { x: 300, y: 150 }),
      },
      {
        key: "titlePosition",
        value: JSON.stringify(body.titlePosition || { x: 960, y: 540 }),
      },
      {
        key: "subtitlePosition",
        value: JSON.stringify(body.subtitlePosition || { x: 960, y: 600 }),
      },
      {
        key: "countPosition",
        value: JSON.stringify(body.countPosition || { x: 960, y: 660 }),
      },
      {
        key: "titleStyle",
        value: JSON.stringify(
          body.titleStyle || { color: "#ffffff", size: 3.1 }
        ),
      },
      {
        key: "subtitleStyle",
        value: JSON.stringify(
          body.subtitleStyle || { color: "#ffffff", size: 1.5 }
        ),
      },
      {
        key: "countStyle",
        value: JSON.stringify(
          body.countStyle || { color: "#ffffff", size: 1.25 }
        ),
      },
      { key: "qrSize", value: String(body.qrSize || 300) },
      { key: "title", value: body.title || "Lucky Draw" },
      { key: "subtitle", value: body.subtitle || "ลุ้นรับรางวัลใหญ่" },
      { key: "showCount", value: String(body.showCount ?? false) },
    ];

    // Save each setting
    await Promise.all(
      settingsToSave.map((setting) =>
        prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: { key: setting.key, value: setting.value },
        })
      )
    );

    const settings = settingsToSave.reduce((acc, curr) => {
      const jsonFields = [
        "qrPosition",
        "titlePosition",
        "subtitlePosition",
        "countPosition",
        "titleStyle",
        "subtitleStyle",
        "countStyle",
      ];
      acc[curr.key] = jsonFields.includes(curr.key)
        ? JSON.parse(curr.value)
        : curr.value;
      // Convert qrSize back to number for response
      if (curr.key === "qrSize") acc[curr.key] = Number(curr.value);
      // Convert showCount back to boolean for response
      if (curr.key === "showCount") acc[curr.key] = curr.value === "true";
      return acc;
    }, {} as any);

    // Emit update event
    qrDisplayEmitter.emit("update", settings);

    return {
      success: true,
      message: "Settings saved successfully",
      data: settings,
    };
  } catch (error) {
    console.error("Error saving QR display settings:", error);
    return {
      success: false,
      message: "Failed to save settings",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
