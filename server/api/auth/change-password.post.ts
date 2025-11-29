import { PrismaClient } from "@prisma/client";
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { currentPassword, newPassword } = body;
  const prisma = new PrismaClient();
  const admin = await prisma.admin.findUnique({
    where: { username: "admin" },
  });
  if (!admin) {
    throw createError({
      statusCode: 404,
      statusMessage: "Admin not found",
    });
  }
  const isValid = verifyPassword(currentPassword, admin.password);
  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid current password",
    });
  }
  const hashedPassword = hashPassword(newPassword);
  await prisma.admin.update({
    where: { username: "admin" },
    data: { password: hashedPassword },
  });
  return { success: true };
});
