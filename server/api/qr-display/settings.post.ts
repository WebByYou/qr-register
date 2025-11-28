import { writeFile } from "fs/promises";
import { join } from "path";
import { qrDisplayEmitter } from "../../utils/qr-display";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    const settings = {
      backgroundImage: body.backgroundImage || "",
      qrPosition: body.qrPosition || { x: 50, y: 50 },
      qrSize: body.qrSize || 300,
    };

    const settingsPath = join(
      process.cwd(),
      "server/data/qr-display-settings.json"
    );
    await writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf-8");

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
