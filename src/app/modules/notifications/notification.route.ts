// src/routes/notification.routes.ts
import express from "express";
import { createNotification, getUserNotifications, markAsRead } from "./notification.controller";

const router = express.Router();

router.post("/create", createNotification); // create new notification
router.get("/getAll/:userId", getUserNotifications); // get all notifications by user
router.patch("/markAsRead/:id/read", markAsRead); // mark notification as read

 export const notificationRoutes = router;
