// src/modules/subscription/subscription.model.ts
import mongoose, { Schema } from "mongoose";
import { ISubscription } from "./subscription.interface";

const SubscriptionSchema = new Schema<ISubscription>(
  {
    title: { type: String, required: true, trim: true },
    priceMonthly: { type: Number, required: true, default: 0 },
    priceYearly: { type: Number, required: true, default: 0 },
    productAddedPowerQuantity: {
      type: Schema.Types.Mixed,
      enum: [Number, "unlimited"],
    },
    featuresMonthly: { type: [String], default: [] },
    featuresYearly: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  SubscriptionSchema
);
