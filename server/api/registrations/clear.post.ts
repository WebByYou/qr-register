import { prisma } from "../../utils/prisma";
import { qrDisplayEmitter } from "../../utils/qr-display";
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { password } = body;

  // Verify admin password
  if (password !== process.env.ADMIN_PASSWORD) {
    throw createError({
      statusCode: 401,
      statusMessage: "รหัสผ่านไม่ถูกต้อง",
    });
  }

  try {
    // Get count before deletion
    const count = await prisma.registration.count();

    // Truncate table (delete all and reset auto-increment)
    await prisma.$executeRaw`TRUNCATE TABLE "Registration" RESTART IDENTITY CASCADE`;

    // Emit update event for count
    qrDisplayEmitter.emit("update", { type: "count", data: 0 });

    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error("Clear all error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "เกิดข้อผิดพลาดในการลบข้อมูล",
    });
  }
});
