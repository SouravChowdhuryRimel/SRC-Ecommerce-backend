// src/models/notification.model.ts
import mongoose, { Schema, Document } from "mongoose";
import { INotification } from "./notifications.interface";


export interface INotificationDocument extends INotification, Document {}

const notificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    userProfile: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const NotificationModel = mongoose.model<INotificationDocument>(
  "Notification",
  notificationSchema
);
