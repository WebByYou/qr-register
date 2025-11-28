import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const history = await prisma.luckyDrawHistory.findMany({
      orderBy: {
        wonAt: "desc",
      },
    });

    return {
      success: true,
      data: history,
    };
  } catch (error) {
    console.error("Error fetching lucky draw history:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch lucky draw history",
    });
  }
});
