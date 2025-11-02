import { Request, Response } from "express";
import { Types } from "mongoose";
import { RequestRefundService } from "./requestRefund.service";
import { uploadMultiple } from "../../utils/cloudinary";

const createRefundRequest = async (req: Request, res: Response) => {
  try {
    const {
      orderId,
      refundReason,
      describeIssue,
      preferredResolution
    } = req.body;

    if (!orderId || !refundReason || !describeIssue || !preferredResolution) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: orderId, refundReason, describeIssue, preferredResolution",
      });
    }

    if (!["Refund Amount", "Replacement"].includes(preferredResolution)) {
      return res.status(400).json({
        success: false,
        message: "preferredResolution must be either 'Refund Amount' or 'Replacement'",
      });
    }

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    if(orderId.status ==="return_requested") {
       return res.status(400).json({
        success: false,
        message: "This request is already submitted for refund ",
      });
    }

    const refundData = {
      orderId: new Types.ObjectId(orderId),
      refundReason,
      describeIssue,
      productImage: [],
      preferredResolution: preferredResolution as "Refund Amount" | "Replacement",
      isAccepted: false,
      isRejected: false,
    };

    const refundRequest = await RequestRefundService.createRefundRequest(
      refundData,
      req.files as Express.Multer.File[]
    );

    res.status(201).json({
      success: true,
      message: "Refund request created successfully",
      data: refundRequest,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getRefundRequestByIdController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const refundRequest = await RequestRefundService.getRefundRequestByIdService(id);

    if (!refundRequest) {
      return res.status(404).json({
        success: false,
        message: "Refund request not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Refund request retrieved successfully",
      data: refundRequest,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const acceptRefundRequestController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const acceptedRefundRequest = await RequestRefundService.acceptRefundRequest(id);

    res.status(200).json({
      success: true,
      message: "Refund request accepted successfully",
      data: acceptedRefundRequest,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const rejectRefundRequest = async (req: Request, res: Response) => {
  try {
    const { refundId } = req.params;
    const { rejectionReason } = req.body;

    const result = await RequestRefundService.rejectRefundRequest(
      refundId,
      rejectionReason
    );
    console.log(result);

    res.status(200).json({
      success: true,
      message: "Refund request rejected successfully",
      data: {
        isRejected: result?.isRejected,
        rejectionReason: result?.rejectionReason,
        orderId: result?.orderId
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const RequestRefundController = {
  createRefundRequest,
  getRefundRequestByIdController,
  acceptRefundRequestController,
  rejectRefundRequest,
};