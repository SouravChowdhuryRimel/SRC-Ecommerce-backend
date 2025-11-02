import { Router } from "express";
import { auth_controllers } from "./auth.controller";
import RequestValidator from "../../middlewares/request_validator";
import auth from "../../middlewares/auth";
import { auth_validation } from "./auth.validation";

const authRoute = Router();

authRoute.post(
  "/login",
  RequestValidator(auth_validation.login_validation),
  auth_controllers.login_user
);

authRoute.post(
  "/refresh-token",
  // auth("Admin", "Buyer", "Seller"),
  auth_controllers.refresh_token
);
authRoute.post(
  "/change-password",
  auth("Buyer", "Seller", "Admin"),
  auth_controllers.change_password
);

authRoute.post("/logout", auth_controllers.logoutRemoveToken);

// Step 1: Request reset code
authRoute.post("/forgot-password", auth_controllers.requestPasswordReset);

// Step 2: Verify code
authRoute.post("/verify-code", auth_controllers.verifyResetCode);

// Step 3: Reset password
authRoute.post("/reset-password", auth_controllers.resetPassword);

export default authRoute;
