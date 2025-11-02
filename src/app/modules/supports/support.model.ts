import mongoose, { Schema } from "mongoose";
import { ISupport } from "./support.interface";

const generateTicketId = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TICKET-${timestamp}-${random}`;
};

const SupportReplySchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const SupportSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    ticketId: {
      type: String,
      required: true,
      unique: true,
      default: generateTicketId
    },
    supportSubject: {
      type: String,
      required: true,
      trim: true
    },
    supportMessage: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Resolved'],
      default: 'Pending'
    },
    replies: [SupportReplySchema],
  },
  {
    timestamps: true
  }
);

export const Support = mongoose.model<ISupport>("Support", SupportSchema);