import { z } from "zod";

const registrationSchema = z.object({
  firstName: z.string().min(1, "กรุณากรอกชื่อ"),
  lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
  employeeId: z
    .string()
    .max(7, "รหัสพนักงานต้องไม่เกิน 7 หลัก")
    .regex(/^\d+$/, "รหัสพนักงานต้องเป็นตัวเลขเท่านั้น"),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const result = registrationSchema.safeParse(body);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0].message,
    });
  }

  const { firstName, lastName, employeeId } = result.data;

  try {
    const registration = await prisma.registration.create({
      data: {
        firstName,
        lastName,
        employeeId,
      },
    });
    return registration;
  } catch (error: any) {
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      throw createError({
        statusCode: 400,
        statusMessage: `${field} already exists`,
      });
    }
    throw error;
  }
});
