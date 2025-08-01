import { z } from "zod";

export const createSubordinateFormSchema = (appConfig) => {
  return z.object({
    title: z.string().min(1, "Title is required"),
    name: z
      .string()
      .min(1, "Name is required")
      .regex(/^[A-Za-z\s]+$/, "Name should only contain letters"),
    Email:
      appConfig?.contact_required_email == "Y"
        ? z
            .string()
            .min(1, "Email is required")
            .email("Invalid email address")
            .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email format")
        : z
            .string()
            .optional()
            .refine(
              (value) =>
                !value ||
                (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) &&
                  z.string().email().safeParse(value).success),
              { message: "Invalid email address" }
            ),
    mobile: z
      .string()
      .min(10, "Mobile number must be 10 digits")
      .max(10, "Mobile number must be 10 digits")
      .regex(/^\d+$/, "Only numbers are allowed"),
  });
};