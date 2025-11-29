import { prisma } from "../../utils/prisma";
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "ID is required",
    });
  }

  try {
    await prisma.registration.delete({
      where: {
        id: parseInt(id),
      },
    });
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2025") {
      throw createError({
        statusCode: 404,
        statusMessage: "Registration not found",
      });
    }
    throw error;
  }
});
