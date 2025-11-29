import { PrismaClient } from "@prisma/client";
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { password } = body;
  const prisma = new PrismaClient();
  const config = useRuntimeConfig();
  const defaultAdminPassword = process.env.ADMIN_PASSWORD || "admin";
  let admin = await prisma.admin.findUnique({
    where: { username: "admin" },
  });
  if (!admin) {
    const hashedPassword = hashPassword(defaultAdminPassword);
    admin = await prisma.admin.create({
      data: {
        username: "admin",
        password: hashedPassword,
      },
    });
  }
  const isValid = verifyPassword(password, admin.password);
  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid password",
    });
  }
  setCookie(event, "isAuth", "true", {
    httpOnly: false,
    maxAge: 60 * 60 * 24, 
    path: "/",
  });
  return { success: true };
});
