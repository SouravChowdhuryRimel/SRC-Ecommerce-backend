import mongoose, { Schema } from "mongoose";
import { IrequestRefund } from "./requestRefund.interface";

const RequestRefundSchema = new Schema<IrequestRefund>(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    refundReason: { type: String, required: true },
    describeIssue: { type: String, required: true },
    rejectionReason: { type: String },
    productImage: [{ type: String, required: true }],
    preferredResolution: {
      type: String,
      required: true,
      enum: ["Refund Amount", "Replacement"],
    },
    isAccepted: { type: Boolean, default: false },
    isRejected: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const RequestRefund = mongoose.model<IrequestRefund>(
  "RequestRefund",
  RequestRefundSchema
);
