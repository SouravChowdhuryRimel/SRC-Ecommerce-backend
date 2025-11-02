import { Document, ObjectId } from "mongoose";

interface IRefundInfo {
  refundId: string;
  amount: number;
  status: string;
  date: Date;
}

export interface IPayment extends Document {
  // For order payments
  orderId?: ObjectId;
  // Seller (for marketplace/order payments)
  sellerId?: ObjectId;

  // For subscription payments
  userId?: ObjectId;
  plan?: "starter" | "advance" | "starterYearly" | "advanceYearly";
  isSubscription?: boolean;

  // Common fields
  amount: number;
  currency: string;
  paymentStatus: "pending" | "succeeded" | "failed" | "refunded";
  paymentIntentId: string;
  createdAt?: Date;
  updatedAt?: Date;
  mode: "payment" | "subscription";
  refundInfo?: IRefundInfo;
  stripeAccountId?: string; // For marketplace payments
  productAddedPowerQuantity?: number | "unlimited";
}
