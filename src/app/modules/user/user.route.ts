import { Router, Request, Response, NextFunction } from "express";
import { user_controllers } from "./user.controller";
import { create_user, update_user } from "./user.validation";
import { z } from "zod";
import auth from "../../middlewares/auth";
import { upload, uploadSingle, uploadSingleforBusinessLogo } from "../../utils/cloudinary";

const userRoute = Router();

// Generic validation middleware
const validate =
  (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ errors: result.error.format() });
    }
    req.body = result.data;
    next();
  };

// Create user
// userRoute.post("/create", validate(create_user), user_controllers.create_user);
userRoute.post(
  "/create",
  upload.fields([
    { name: 'businessLogo', maxCount: 1 }
  ]),
  user_controllers.create_user
);

// Get single user by ID
userRoute.get("/get-single/:id", user_controllers.get_single_user);
userRoute.post("/googleAuthLogin", user_controllers.googleAuthLogin);

// Get all users
userRoute.get("/getAll", user_controllers.get_all_users);
userRoute.get(
  "/myProfile",
  auth("Admin", "Buyer", "Seller"),
  user_controllers.myProfile
);

// Update user
userRoute.put(
  "/update/:id",
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'businessLogo', maxCount: 1 }
  ]),
  user_controllers.update_single_user
);

// Soft delete user
userRoute.put("/delete/:id", user_controllers.delete_user);

// FCM TOKEN UPDATE
userRoute.put(
  "/save-fcm-token",
  auth("Admin", "Buyer", "Seller"),
  user_controllers.fcmTokenUpdate
);

// PAYMENT METHODS ROUTES

// Add payment method
userRoute.post("/:userId/payment-method", user_controllers.addPaymentMethod);

// Update payment method
userRoute.put(
  "/:userId/payment-method/:paymentId",
  user_controllers.updatePaymentMethod
);

// Set default payment method
userRoute.patch(
  "/:userId/payment-method/:paymentId/setDefault",
  user_controllers.setDefaultPaymentMethod
);

// Delete payment method
userRoute.delete(
  "/:userId/payment-method/:paymentId",
  user_controllers.deletePaymentMethod
);

export default userRoute;
