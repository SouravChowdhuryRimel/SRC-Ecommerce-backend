import mongoose, { Schema, Document } from "mongoose";
import {
  IOrder,
  IOrderStatusDates,
  IShippingAddress,
  IPaymentInfo,
  IOrderItem,
} from "./order.interface";

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String },
  },
  { _id: false }
);

const OrderStatusDatesSchema = new Schema<IOrderStatusDates>(
  {
    placed: { type: Date },
    payment_processed: { type: Date },
    shipped: { type: Date },
    out_for_delivery: { type: Date },
    delivered: { type: Date },
    cancelled: { type: Date },
    return_requested: { type: Date },
    returned: { type: Date },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const PaymentInfoSchema = new Schema<IPaymentInfo>(
  {
    cardLast4: { type: String },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentDate: { type: Date },
    transactionId: { type: String },
  },
  { _id: false }
);

const generateOrderNumber = (): string => {
  const datePart = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 8); // YYYYMMDD
  const randomPart = Math.floor(1000 + Math.random() * 9000); // 6-digit random number
  return `ORD-${datePart}-${randomPart}`;
};

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      default: generateOrderNumber,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User" },

    items: [OrderItemSchema],

    subtotal: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    tax: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    currency: { type: String, required: true, default: "AED" },
    paymentMethod: { type: String, required: true, default: "Stripe" },
    paymentInfo: { type: PaymentInfoSchema, default: {} },
    status: {
      type: String,
      enum: [
        "placed",
        "payment_processed",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "return_requested",
        "returned",
      ],
      default: "placed",
    },
    contactInfo: {
      email: { type: String, required: true },
      phone: { type: String },
    },

    statusDates: {
      type: OrderStatusDatesSchema,
      default: () => ({ placed: new Date() }),
    },

    shippingAddress: { type: ShippingAddressSchema, required: true },
  },
  { timestamps: true }
);

export const Order = mongoose.model<IOrder>("Order", OrderSchema);
