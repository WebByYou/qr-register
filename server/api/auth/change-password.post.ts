import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { currentPassword, newPassword } = body;

  const prisma = new PrismaClient();

  // In a real app, we'd get the user ID from the session/token.
  // Here we assume single admin user "admin"
  const admin = await prisma.admin.findUnique({
    where: { username: "admin" },
  });

  if (!admin) {
    throw createError({
      statusCode: 404,
      statusMessage: "Admin not found",
    });
  }

  // Verify current password
  const isValid = verifyPassword(currentPassword, admin.password);
  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid current password",
    });
  }

  // Update password
  const hashedPassword = hashPassword(newPassword);
  await prisma.admin.update({
    where: { username: "admin" },
    data: { password: hashedPassword },
  });

  return { success: true };
});
