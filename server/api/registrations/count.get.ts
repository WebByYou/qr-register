export default defineEventHandler(async (event) => {
  try {
    const count = await prisma.registration.count();
    return {
      success: true,
      count,
    };
  } catch (error) {
    console.error("Error fetching registration count:", error);
    return {
      success: false,
      count: 0,
      message: "Failed to fetch count",
    };
  }
});
