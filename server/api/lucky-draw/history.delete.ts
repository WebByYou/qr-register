import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    await prisma.luckyDrawHistory.deleteMany({});

    return {
      success: true,
      message: "History cleared successfully",
    };
  } catch (error) {
    console.error("Error clearing lucky draw history:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to clear history",
    });
  }
});
