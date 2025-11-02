import { z } from "zod";
import { is } from "zod/v4/locales";

// Create user schema
export const create_user = z
  .object({
    role: z.enum(["Admin", "Buyer", "Seller"]),
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    fcmToken: z.string().optional(),
    address: z
      .object({
        state: z.string().optional(),
        city: z.string().optional(),
        zip: z.string().optional(),
        streetAddress: z.string().optional(),
      })
      .optional(),
    paymentMethods: z
      .array(
        z.object({
          _id: z.string().optional(),
          method: z.string().optional(),
          cardNumber: z.number().optional(),
          expiryDate: z.string().optional(),
          cvv: z.number().optional(),
          isDefault: z.boolean().optional(),
        })
      )
      .optional(),
    preferences: z.enum(["Fashion", "Food", "Beauty", "Perfume"]).optional(),
    businessInfo: z
      .object({
        businessName: z.string().optional(),
        businessType: z.string().optional(),
        businessDescription: z.string().optional(),
        country: z.string().optional(),
        phoneNumber: z.string().optional(),
        businessLogo: z.string().optional(),
      })
      .optional(),
    isPaidPlan: z.boolean().optional(),
    subscribtionPlan: z.enum(["basic", "professional", "premium"]).optional(),
    deviceToken: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Update user schema
export const update_user = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  address: z
    .object({
      state: z.string().optional(),
      city: z.string().optional(),
      zip: z.string().optional(),
      streetAddress: z.string().optional(),
    })
    .optional(),
  preferences: z.enum(["Fashion", "Food", "Beauty", "Perfume"]).optional(),
  businessInfo: z
    .object({
      businessName: z.string().optional(),
      businessType: z.string().optional(),
      businessDescription: z.string().optional(),
      country: z.string().optional(),
      phoneNumber: z.string().optional(),
      businessLogo: z.string().optional(),
    })
    .optional(),

  paymentMethods: z
    .array(
      z.object({
        _id: z.string().optional(),
        method: z.string().optional(),
        cardNumber: z.string().optional(),
        expiryDate: z.string().optional(),
        cvv: z.string().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .optional(),
  profileImage: z.string().optional(),
  businessLogo: z.string().optional(),
  subscribtionPlan: z.enum(["basic", "professional", "premium"]).optional(),
});
