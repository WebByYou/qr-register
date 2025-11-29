import { writeFile } from "fs/promises";
import { join } from "path";
import { createHash } from "crypto";
export default defineEventHandler(async (event) => {
  try {
    const form = await readMultipartFormData(event);
    if (!form || form.length === 0) {
      return {
        success: false,
        message: "No file uploaded",
      };
    }
    const file = form[0];
    if (!file.filename || !file.data) {
      return {
        success: false,
        message: "Invalid file data",
      };
    }
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type || "")) {
      return {
        success: false,
        message:
          "Invalid file type. Only images are allowed (JPEG, PNG, GIF, WebP)",
      };
    }
    const hash = createHash("md5").update(file.data).digest("hex");
    const ext = file.filename.split(".").pop();
    const filename = `bg-${hash}.${ext}`;
    const uploadsDir = join(process.cwd(), "public/uploads/backgrounds");
    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, file.data);
    const url = `/uploads/backgrounds/${filename}`;
    return {
      success: true,
      message: "File uploaded successfully",
      data: {
        url,
        filename,
      },
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      success: false,
      message: "Failed to upload file",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
