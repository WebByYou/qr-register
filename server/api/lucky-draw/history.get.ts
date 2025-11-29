import { prisma } from "../../utils/prisma";
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const search = (query.search as string) || "";
  const sortBy = (query.sortBy as string) || "wonAt";
  const sortOrder = (query.sortOrder as string) || "desc";
  const offset = (page - 1) * limit;
  const where = search
    ? {
        OR: [
          { employeeId: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { prize: { contains: search } },
        ],
      }
    : {};
  const orderBy: any = {};
  orderBy[sortBy] = sortOrder;
  try {
    const total = await prisma.winner.count({ where });
    const history = await prisma.winner.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
    });
    return {
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching lucky draw history:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch lucky draw history",
    });
  }
});
