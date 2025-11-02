import { is } from "zod/v4/locales";
import { configs } from "../../configs";
import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import { auth_services } from "./auth.service";
import httpStatus from "http-status";
import { Request, Response } from "express";

const login_user = catchAsync(async (req, res) => {
  // console.log(' req body form controller ',req.body)

  const result = await auth_services.login_user_from_db(req.body);

  // console.log(' login result from controller ',result)

  res.cookie("refreshToken", result.refreshToken, {
    secure: configs.env == "production",
    httpOnly: true,
  });
  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User is logged in successful !",
    data: {
      accessToken: result.accessToken,
      refresh_token: result.refreshToken,
      role: result?.role,
      userId: result?.userId,
      isPaidPlan: result?.isPaidPlan || false,
      subscribtionPlan: result?.subscribtionPlan || null,
    },
  });
});

const refresh_token = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await auth_services.refresh_token_from_db(refreshToken);
  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Refresh token generated successfully!",
    data: result,
  });
});

const change_password = catchAsync(async (req, res) => {
  const user = req?.user;
  // console.log("User", user)
  const result = await auth_services.change_password_from_db(user!, req.body);

  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully!",
    data: result,
  });
});

const logoutRemoveToken = catchAsync(async (req, res) => {
  const { userId, deviceToken } = req?.body;
  await auth_services.logoutRemoveToken(userId, deviceToken);
  manageResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logout successFull",
  });
});

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const result = await auth_services.requestPasswordReset(email);
    res.status(200).json({ message: "Verification code sent", result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const verifyResetCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    const result = await auth_services.verifyResetCode(email, code);
    res.status(200).json({ message: "Code verified successfully", result });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    await auth_services.resetPassword(email, code, newPassword);
    res.status(200).json({ message: "Password reset successful" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const auth_controllers = {
  login_user,
  refresh_token,
  change_password,

  logoutRemoveToken,

  requestPasswordReset,
  verifyResetCode,
  resetPassword,
};
