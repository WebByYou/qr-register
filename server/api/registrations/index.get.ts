export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const search = (query.search as string) || "";
  const offset = (page - 1) * limit;

  // Build where clause for search
  const where = search
    ? {
        OR: [
          { employeeId: { contains: search } },
          { firstName: { contains: search } },
          { lastName: { contains: search } },
        ],
      }
    : {};

  // Get total count for pagination
  const total = await prisma.registration.count({ where });

  // Get paginated data
  const registrations = await prisma.registration.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip: offset,
    take: limit,
  });

  return {
    data: registrations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
});
