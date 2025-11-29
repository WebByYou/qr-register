export default defineEventHandler(async (event) => {
  try {
    await prisma.winner.deleteMany({});

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
