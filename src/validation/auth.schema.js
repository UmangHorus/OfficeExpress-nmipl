import { z } from "zod";

export const loginSchema = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, {
      message: "Mobile number must be exactly 10 digits and only numbers",
    }),
});
