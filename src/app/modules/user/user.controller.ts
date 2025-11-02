import { Request, Response } from "express";
import catchAsync from "../../utils/catch_async";
import manageResponse from "../../utils/manage_response";
import { user_service, user_services } from "./user.service";
import httpStatus from "http-status";

// const create_user = catchAsync(async (req, res) => {
//   const result = await user_service.createUser(req.body);

//   manageResponse(res, {
//     success: true,
//     statusCode: httpStatus.CREATED,
//     message: "User created successfully.",
//     data: result,
//   });
// });
const create_user = catchAsync(async (req, res) => {
  const file = req.file; 
  const files = req.files as { [fieldname: string]: Express.Multer.File[] }; 

  // Prepare user data from form data
  const userData: any = { ...req.body };

  // Handle business logo file (priority to multiple files, then single file)
  if (files?.['businessLogo']?.[0]) {
    userData.businessLogoFile = files['businessLogo'][0];
  } else if (file) {
    userData.businessLogoFile = file;
  }

  // Parse any JSON fields if needed (like address, paymentMethods, etc.)
  if (userData.address && typeof userData.address === 'string') {
    try {
      userData.address = JSON.parse(userData.address);
    } catch (error) {
      // If parsing fails, keep as string or handle error
      console.warn('Failed to parse address field');
    }
  }

  if (userData.paymentMethods && typeof userData.paymentMethods === 'string') {
    try {
      userData.paymentMethods = JSON.parse(userData.paymentMethods);
    } catch (error) {
      console.warn('Failed to parse paymentMethods field');
    }
  }

  const result = await user_service.createUser(userData);
  
  manageResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User created successfully.",
    data: result,
  });
});

const get_single_user = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await user_service.getUserById(id);

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User fetched successfully",
    data: result,
  });
});
const googleAuthLogin = catchAsync(async (req, res) => {

  const data = req.body;

  const result = await user_service.googleAuthLogin(data);

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User fetched successfully",
    data: result,
  });
});

const get_all_users = catchAsync(async (req, res) => {
  const result = await user_service.getAllUsers();

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All users fetched successfully.",
    data: result,
  });
});
const myProfile = catchAsync(async (req, res) => {
  console.log("Request User:", req.user); // Debugging line to check req.user

  const userId = req.user?.userId; // Assuming auth middleware sets req.user

  const result = await user_service.myProfile(userId);

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All users fetched successfully.",
    data: result,
  });
});

const update_single_user = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Handle multiple file uploads
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const profileImageFile = files?.["profileImage"]?.[0];
  const businessLogoFile = files?.["businessLogo"]?.[0];

  // Prepare update data
  const updateData: any = { ...req.body };

  // Add files to update data if they exist
  if (profileImageFile) {
    updateData.profileImageFile = profileImageFile;
  }

  if (businessLogoFile) {
    updateData.businessLogoFile = businessLogoFile;
  }

  // Backward compatibility: if single file upload (from previous implementation)
  if (req.file && !profileImageFile && !businessLogoFile) {
    updateData.profileImageFile = req.file;
  }

  const result = await user_service.updateUser(id, updateData);

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User updated successfully.",
    data: result,
  });
});

const delete_user = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await user_service.delete_user(id);

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User deleted successfully (soft delete).",
    data: result,
  });
});

const fcmTokenUpdate = catchAsync(async (req, res) => {
  const userId = req.user?.userId;
  const { fcmToken } = req.body;

  const result = await user_service.updateFcmToken(userId, fcmToken);

  manageResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "FCM token updated successfully.",
    data: result,
  });
});

const addPaymentMethod = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const paymentData = req.body;
    const result = await user_services.addPaymentMethodService(
      userId,
      paymentData
    );
    res.status(201).json({
      success: true,
      message: "Payment method added successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✏️ Update payment method
const updatePaymentMethod = async (req: Request, res: Response) => {
  try {
    const { userId, paymentId } = req.params;
    const result = await user_services.updatePaymentMethodService(
      userId,
      paymentId,
      req.body
    );
    res.json({
      success: true,
      message: "Payment method updated",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 🌟 Set default payment method
const setDefaultPaymentMethod = async (req: Request, res: Response) => {
  try {
    const { userId, paymentId } = req.params;
    const result = await user_services.setDefaultPaymentMethodService(
      userId,
      paymentId
    );
    res.json({
      success: true,
      message: "Default payment method set",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ❌ Delete payment method
const deletePaymentMethod = async (req: Request, res: Response) => {
  try {
    const { userId, paymentId } = req.params;
    const result = await user_services.deletePaymentMethodService(
      userId,
      paymentId
    );
    res.json({
      success: true,
      message: "Payment method deleted",
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const user_controllers = {
  create_user,
  googleAuthLogin,
  get_single_user,
  get_all_users,
  myProfile,
  update_single_user,
  delete_user,
  fcmTokenUpdate,
  addPaymentMethod,
  updatePaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
};
