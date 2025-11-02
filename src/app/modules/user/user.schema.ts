import { model, Schema } from "mongoose";
import { TUser } from "./user.interface";

// Sub-schema for Payment Methods
const PaymentMethodSchema = new Schema(
  {
    method: {
      type: String,
      required: true,
      enum: ["Visa", "Mastercard", "PayPal", "Bank Transfer"], // extendable
    },
    cardNumber: { type: Number, required: true },
    expiryDate: { type: String, required: true },
    cvv: { type: Number, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true } // 👈 ensures each payment method gets its own ObjectId (paymentId)
);

// Sub-schema for Address
const AddressSchema = new Schema(
  {
    state: { type: String },
    city: { type: String },
    zip: { type: String },
    streetAddress: { type: String },
  },
  { _id: false }
);

// Sub-schema for Business Info
const BusinessInfoSchema = new Schema(
  {
    businessName: { type: String },
    businessType: { type: String },
    businessDescription: { type: String },
    country: { type: String },
    phoneNumber: { type: String },
    businessLogo: { type: String },
  },
  { _id: false }
);

const UserSchema = new Schema<TUser>(
  {
    role: { type: String, required: true, enum: ["Admin", "Buyer", "Seller"] },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String,  },
    confirmPassword: { type: String,  },
    fcmToken: { type: String, default: null },

    isDeleted: { type: Boolean, default: false },

    address: { type: AddressSchema, default: {} },

    paymentMethods: {
      type: [PaymentMethodSchema],
      default: [],
    },

    preferences: {
      type: String,
      trim: true,
      enum: ["Fashion", "Food", "Beauty", "Perfume"],
    },

    businessInfo: { type: BusinessInfoSchema, default: {} },
    profileImage: {
      type: String,
      default:
        "https://img.freepik.com/premium-vector/male-face-avatar-icon-set-flat-design-social-media-profiles_1281173-3806.jpg",
    },
    businessLogo: {
      type: String,
      default:
        "https://img.freepik.com/premium-vector/male-face-avatar-icon-set-flat-design-social-media-profiles_1281173-3806.jpg",
    },
    isPaidPlan: { type: Boolean, default: false },
    subscribtionPlan: {
      type: String,
      enum: ["starter", "advance", "starterYearly", "advanceYearly"],
    },
    productAddedPowerQuantity: {
      type: Schema.Types.Mixed,
      enum: [Number, "unlimited"],
    },
    deviceToken: { type: String, default: null }, // for single device plans
    deviceTokens: { type: [String], default: [] }, // for multiple device plans
    checkoutAccountId: { type: String },
    subscriptionExpiryDate: { type: Date },
    isSubscriptionActive: { type: Boolean},
    checkoutSecretKey: { type: String },
    checkoutProcessingChannelId: { type: String },
    checkoutPublicKey: { type: String },
    stripeAccountId: { type: String },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const User_Model = model<TUser>("User", UserSchema);
