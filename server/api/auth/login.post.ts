export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { password } = body;

  const config = useRuntimeConfig();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (password !== adminPassword) {
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
