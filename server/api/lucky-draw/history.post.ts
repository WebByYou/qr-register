import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const historySchema = z.object({
  employeeId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  department: z.string().optional(),
  prize: z.string().optional(),
  wonAt: z.string().or(z.date()).optional(),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const result = historySchema.safeParse(body);

    if (!result.success) {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid data format",
      });
    }

    const data = result.data;

    const savedRecord = await prisma.luckyDrawHistory.create({
      data: {
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        department: data.department,
        prize: data.prize,
        wonAt: data.wonAt ? new Date(data.wonAt) : new Date(),
      },
    });

    return {
      success: true,
      data: savedRecord,
    };
  } catch (error) {
    console.error("Error saving lucky draw history:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to save lucky draw history",
    });
  }
});
