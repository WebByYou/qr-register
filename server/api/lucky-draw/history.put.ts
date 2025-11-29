import { z } from "zod";

const updateHistorySchema = z.object({
  id: z.number(),
  prize: z.string(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const result = updateHistorySchema.safeParse(body);

    if (!result.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid input",
        data: result.error.issues,
      });
    }

    const { id, prize } = result.data;

    const updatedHistory = await prisma.winner.update({
      where: { id },
      data: { prize },
    });

    return {
      success: true,
      data: updatedHistory,
    };
  } catch (error) {
    console.error("Error updating lucky draw history:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to update history",
    });
  }
});
