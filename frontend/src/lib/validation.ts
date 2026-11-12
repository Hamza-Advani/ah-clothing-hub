import { z } from "zod";
import { PK_PHONE_REGEX } from "./utils";

export const phoneSchema = z.string().trim().regex(PK_PHONE_REGEX, "Enter a valid number, e.g. 0300 1234567");

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  phone: phoneSchema,
  email: z.string().trim().email("Enter a valid email address"),
  address: z.string().trim().min(8, "Please enter your full address (house, street, area)").max(300),
  city: z.string().min(2, "Please select your city"),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(["cod", "jazzcash", "easypaisa"]),
  txnId: z.string().max(60).optional(),
  saveAddress: z.boolean().optional(),
});
export type CheckoutValues = z.infer<typeof checkoutSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Please enter your password"),
  remember: z.boolean().optional(),
});

export const passwordRule = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Za-z]/, "Include at least one letter")
  .regex(/\d/, "Include at least one number");

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your name").max(80),
    email: z.string().trim().email("Enter a valid email address"),
    phone: phoneSchema.or(z.literal("")).optional(),
    password: passwordRule,
    confirm: z.string(),
    terms: z.boolean().refine((v) => v, "Please accept the terms to continue"),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });

export const changePasswordSchema = z
  .object({ current: z.string().min(1, "Enter your current password"), password: passwordRule, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords don't match" });

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  phone: phoneSchema.or(z.literal("")).optional(),
  subject: z.string().trim().min(3, "Please add a subject").max(120),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(2000),
});

export const addressSchema = z.object({
  label: z.string().trim().min(1, "e.g. Home, Office").max(30),
  name: z.string().trim().min(2, "Enter recipient name"),
  phone: phoneSchema,
  address: z.string().trim().min(8, "Enter full address"),
  city: z.string().min(2, "Select a city"),
  isDefault: z.boolean().optional(),
});
