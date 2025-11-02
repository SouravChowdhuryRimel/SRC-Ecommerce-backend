import { Schema, model, Types } from "mongoose";
import { IPromotion } from "./promotion.interface";

const PromotionSchema = new Schema<IPromotion>(
  {

    sellerId: { type: String, required: true },
    promotionImage: { type: String, required: true },
    promotionName: { type: String, required: true },
    promotionType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: { type: Number, required: true },
    minimumPurchase: { type: Number, required: true },

    applicableType: {
      type: String,
      enum: ["allProducts", "specificProducts", "productCategories"],
      required: true,
    },

    allProducts: [{ type: Types.ObjectId, ref: "Product" }],
    specificProducts: [{ type: Types.ObjectId, ref: "Product" }],
    productCategories: [{ type: String }],

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    termsAndConditions: { type: String },
    isActive: { type: Boolean, default: true },

    totalView: { type: Number, default: 0 },
    totalClick: { type: Number, default: 0 },
    redemptionRate: { type: String },
    conversionRate: { type: String },
  },
  { timestamps: true }
);



export const PromotionModel = model<IPromotion>("Promotion", PromotionSchema);
