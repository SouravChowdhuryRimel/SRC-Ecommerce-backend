// src/controllers/notification.controller.ts
import { Request, Response } from "express";
import { NotificationModel } from "./notifications.model";

export const createNotification = async (req: Request, res: Response) => {
  try {
    const { userId, title, body, userProfile } = req.body;

    const notification = await NotificationModel.create({
      userId,
      title,
      body,
      userProfile,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const notifications = await NotificationModel.find({ userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updated = await NotificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error });
  }
};
