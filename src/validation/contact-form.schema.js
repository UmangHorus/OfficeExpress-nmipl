import { z } from "zod";

export const createContactFormSchema = (appConfig) => {
  return z.object({
    title: z.string().min(1, "Title is required"),
    name: z
      .string()
      .min(1, "Name is required")
      .regex(/^[A-Za-z\s]+$/, "Name should only contain letters"),
    // routes: z.array(z.string()).min(1, "At least one route must be selected"), // for required routes
    routes: z.array(z.string()).default([]),

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
    // mobile: appConfig?.contact_required_mobile_no == "Y"
    //   ? z
    //       .string()
    //       .min(10, "Mobile number must be 10 digits")
    //       .max(10, "Mobile number must be 10 digits")
    //       .regex(/^\d+$/, "Only numbers are allowed")
    //   : z
    //       .string()
    //       .max(10, "Mobile number must be 10 digits")
    //       .regex(/^\d*$/, "Only numbers are allowed")
    //       .optional(),
    mobile: z
      .string()
      .min(10, "Mobile number must be 10 digits")
      .max(10, "Mobile number must be 10 digits")
      .regex(/^\d+$/, "Only numbers are allowed"),
    address:
      appConfig?.required_add1 == "Y"
        ? z.string().min(1, "Address is required")
        : z.string().optional(),
    area:
      appConfig?.contact_required_area == "Y"
        ? z.string().min(1, "Area is required")
        : z.string().optional(),
    pincode:
      appConfig?.required_pincode == "Y"
        ? z
            .string()
            .min(1, "Pincode is required")
            .regex(/^\d{6}$/, "Pincode must be 6 digits")
        : z
            .string()
            .regex(/^\d{0,6}$/, "Pincode must be up to 6 digits")
            .optional(),
    city:
      appConfig?.contact_required_city == "Y"
        ? z.string().min(1, "City is required")
        : z.string().optional(),
    industry: z.string().optional(),
    country: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
  });
};
