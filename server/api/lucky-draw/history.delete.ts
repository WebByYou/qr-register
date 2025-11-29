import { qrDisplayEmitter } from "../../utils/qr-display";
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const id = query.id;

  try {
    if (id) {
      await prisma.winner.delete({
        where: {
          id: Number(id),
        },
      });
      qrDisplayEmitter.emit("update", { type: "refresh" });
      return {
        success: true,
        message: "Winner deleted successfully",
      };
    } else {
      await prisma.winner.deleteMany({});
      qrDisplayEmitter.emit("update", { type: "clear-history" });
      return {
        success: true,
        message: "History cleared successfully",
      };
    }
  } catch (error) {
    console.error("Error clearing lucky draw history:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to clear history",
    });
  }
});
