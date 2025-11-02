import mongoose, { Schema } from "mongoose";
import { IPayment } from "./payment.interface";

const PaymentSchema = new Schema<IPayment>(
  {
    // ✅ For order payments
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    // Link to seller (if payment is for an order with a seller)
    sellerId: { type: Schema.Types.ObjectId, ref: "User" },

    // ✅ For subscription payments
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    plan: {
      type: String,
      enum: ["starter", "advance", "starterYearly", "advanceYearly"],
    },
    isSubscription: { type: Boolean, default: false },

    // ✅ Common fields
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "aed" },
    paymentStatus: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
    },
    paymentIntentId: { type: String, required: true },
    mode: {
      type: String,
      enum: ["payment", "subscription"],
    },
    refundInfo: {
      refundId: { type: String },
      amount: { type: Number },
      status: { type: String },
      date: { type: Date },
    },
    stripeAccountId: { type: String }, // For marketplace payments
    productAddedPowerQuantity: {
      type: Schema.Types.Mixed,
      enum: [Number, "unlimited"],
    },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);
