import { z } from "zod";

export const CreatePromotionSchema = z.object({
  // ✅ required fields
  sellerId: z.string(),
  promotionName: z.string(),
  promotionType: z.enum(["percentage", "fixed"]),

  // ✅ numeric fields (convert from form-data string to number)
  discountValue: z.preprocess((val) => Number(val), z.number().min(0)),
  minimumPurchase: z.preprocess((val) => Number(val), z.number().min(0)),

  // ✅ applicable type (new)
  applicableType: z.enum([
    "allProducts",
    "specificProducts",
    "productCategories",
  ]),

  // ✅ JSON string to array conversions
  allProducts: z.preprocess((val) => {
    if (typeof val === "string" && val.trim() !== "") return JSON.parse(val);
    return Array.isArray(val) ? val : [];
  }, z.array(z.string()).optional()),

  specificProducts: z.preprocess((val) => {
    if (typeof val === "string" && val.trim() !== "") return JSON.parse(val);
    return Array.isArray(val) ? val : [];
  }, z.array(z.string()).optional()),

  productCategories: z.preprocess((val) => {
    if (typeof val === "string" && val.trim() !== "") return JSON.parse(val);
    return Array.isArray(val) ? val : [];
  }, z.array(z.string()).optional()),

  // ✅ Dates from form-data are strings
  startDate: z.string(),
  endDate: z.string(),

  // ✅ Optional fields
  termsAndConditions: z.string().optional(),
  isActive: z.preprocess((val) => val === "true", z.boolean().optional()),
});

// ✅ Update schema — all fields optional
export const UpdatePromotionSchema = CreatePromotionSchema.partial();
