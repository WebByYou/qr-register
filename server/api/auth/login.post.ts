import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { password } = body;

  const prisma = new PrismaClient();
  const config = useRuntimeConfig();
  const defaultAdminPassword = process.env.ADMIN_PASSWORD || "admin";

  // Check if admin exists
  let admin = await prisma.admin.findUnique({
    where: { username: "admin" },
  });

  // If no admin exists, create one with the default password
  if (!admin) {
    const hashedPassword = hashPassword(defaultAdminPassword);
    admin = await prisma.admin.create({
      data: {
        username: "admin",
        password: hashedPassword,
      },
    });
  }

  // Verify password
  const isValid = verifyPassword(password, admin.password);

  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid password",
    });
  }

  // Set cookie
  setCookie(event, "isAuth", "true", {
    httpOnly: false,
    maxAge: 60 * 60 * 24, // 1 day
    path: "/",
  });

  return { success: true };
});
