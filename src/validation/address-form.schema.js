import { z } from "zod";

export const createAddressFormSchema = (appConfig) => {
  return z.object({
    nickname: z.string().min(1, "Address type is required"),
    address1: appConfig?.required_add1 === "Y"
      ? z.string().min(1, "Address is required")
      : z.string().optional(),
    area: appConfig?.contact_required_area === "Y"
      ? z
          .string()
          .min(1, "Area is required")
          .regex(/^[A-Za-z\s]+$/, "Area should only contain letters and spaces")
      : z
          .string()
          .regex(/^[A-Za-z\s]*$/, "Area should only contain letters and spaces")
          .optional(),
    city: appConfig?.contact_required_city === "Y"
      ? z
          .string()
          .min(1, "City is required")
          .regex(/^[A-Za-z\s]+$/, "City should only contain letters and spaces")
      : z
          .string()
          .regex(/^[A-Za-z\s]*$/, "City should only contain letters and spaces")
          .optional(),
    zipcode: appConfig?.required_pincode === "Y"
      ? z
          .string()
          .min(1, "Pincode is required")
          .regex(/^\d{6}$/, "Pincode must be 6 digits")
      : z
          .string()
          .regex(/^\d{0,6}$/, "Pincode must be up to 6 digits")
          .optional(),
    selcountry: z.string().min(1, "Country is required"),
    selstate: z.string().min(1, "State is required"),
    // routes: z.array(z.string()).default([]),
  });
};