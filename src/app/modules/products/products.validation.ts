import { z } from "zod";

export const ProductVariationSchema = z.object({
  image: z.string().url().optional(), // must be a valid URL if provided
  color: z.string().optional(),
  size: z.string().optional(),
});

export const ProductSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  name: z.string().min(2, "Product name must be at least 2 characters"),
  sku: z.string().min(1, "SKU is required"),
  category: z.string(),
  brand: z.string().optional(),
  shopName: z.string().optional().nullable(),
  weight: z.number().optional(),
  gender: z.enum(["male", "female"]).default("male"),
  availableSizes: z.array(z.string()).optional(),
  availableColors: z.array(z.string()).optional(),
  variations: z.array(z.string()).optional(), // e.g., ["Red - M", "Blue - L"]
  description: z.string().min(5, "Description must be at least 5 characters"),
  quantity: z.number().min(0, "Quantity must be 0 or more").default(0),
  price: z.number().positive("Price must be greater than 0"),
  newPrice: z.number().optional(),
  discountType: z.enum(["percentage", "fixed"]).optional().nullable(),
  discountValue: z.number().min(0).optional(),
  productImages: z
    .array(z.string().url("Must be a valid URL"))
    .min(1, "At least one image is required"),
  reviews: z
    .array(
      z.object({
        userId: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .optional(),
  averageRating: z.number().min(0).max(5).optional(),
  shopReviews: z.number().min(0).max(5).optional(),
  salesCount: z.number().min(0).default(0),
  isNewArrival: z.boolean().default(false),
  isWishlisted: z.boolean().default(false),
});

// ✅ Schema for creating a product
export const CreateProductSchema = ProductSchema;

// ✅ Schema for updating a product (all fields optional except _id in route param)
export const UpdateProductSchema = ProductSchema.partial();
