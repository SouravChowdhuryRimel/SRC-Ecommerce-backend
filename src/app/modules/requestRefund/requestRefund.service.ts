import { Types } from "mongoose";
import { RequestRefund } from "./requestRefund.model";
import { IrequestRefund } from "./requestRefund.interface";
import { Order } from "../order/order.model";
import { uploadMultipleImages } from "../../utils/cloudinary";
import { Product } from "../products/products.model";
import { sendNotification } from "../../utils/notificationHelper";

const createRefundRequest = async (
  refundData: IrequestRefund,
  productImageFiles?: Express.Multer.File[]
): Promise<IrequestRefund> => {
  try {
    // Validate if order exists
    const orderExists = await Order.findById(refundData.orderId);
    if (!orderExists) {
      throw new Error("Order not found");
    }

    // Check if refund request already exists for this order
    const existingRefund = await RequestRefund.findOne({
      orderId: refundData.orderId,
    });

    if (existingRefund) {
      throw new Error("Refund request already exists for this order");
    }

    // Upload multiple product images to Cloudinary if files exist
    if (productImageFiles && productImageFiles.length > 0) {
      const filePaths = productImageFiles.map((file) => file.path);
      const imageUrls = await uploadMultipleImages(
        filePaths,
        "refund-requests"
      );
      refundData.productImage = imageUrls;
    } else {
      throw new Error("At least one product image is required");
    }

    // Create refund request
    const refundRequest = await RequestRefund.create(refundData);
    

    const order: any = await Order.findByIdAndUpdate(
      refundData.orderId,
      {
        status: "return_requested",
        "statusDates.returnRequestedAt": new Date(),
        $set: {
          // Keep existing status dates, only update returnRequestedAt
          "statusDates.returnRequestedAt": new Date(),
        },
      },
      { new: true }
    );

    const sellerIds = new Set<string>();

    console.log("seller ids ", sellerIds);
    for (const item of order.items) {
      console.log("items", item);
      if (item.productId && (item.productId as any).userId) {
        sellerIds.add((item.productId as any).userId.toString());
      } else {
        // if product is not populated, fetch it
        const product = await Product.findById(item.productId);
        if (product?.userId) sellerIds.add(product.userId.toString());
      }
    }

    // 7️⃣ Create a notification for each seller
    for (const sellerId of sellerIds) {
      console.log("seller id ", sellerId);
      await sendNotification(
        sellerId.toString(),
        "Refund Request Received",
        `A refund has been requested for your order`
      );
    }

    return refundRequest;
  } catch (error: any) {
    throw new Error(`Failed to create refund request: ${error.message}`);
  }
};

const getRefundRequestByIdService = async (
  refundId: string
): Promise<IrequestRefund | null> => {
  if (!Types.ObjectId.isValid(refundId)) {
    throw new Error("Invalid refund request ID");
  }

  try {
    const refundRequest = await RequestRefund.findOne({ orderId: refundId });
    console.log("reue", refundRequest);

    return refundRequest;
  } catch (error: any) {
    throw new Error(`Failed to fetch refund request: ${error.message}`);
  }
};

const acceptRefundRequest = async (
  refundId: string
): Promise<IrequestRefund | null> => {
  if (!Types.ObjectId.isValid(refundId)) {
    throw new Error("Invalid refund request ID");
  }

  try {
    // Find the refund request first
    const refundRequest = await RequestRefund.findOne({ orderId: refundId });
    console.log("resuset ", refundRequest);
    if (!refundRequest) {
      throw new Error("Refund request not found");
    }

    // Check if already accepted
    if (refundRequest.isAccepted) {
      throw new Error("Refund request is already accepted");
    }

    // Update isAccepted to true
    const updatedRefundRequest = await RequestRefund.findOneAndUpdate(
      { orderId: refundId },
      {
        $set: {
          isAccepted: true,
        },
      },
      { new: true }
    );

    return updatedRefundRequest;
  } catch (error: any) {
    throw new Error(`Failed to accept refund request: ${error.message}`);
  }
};

const rejectRefundRequest = async (
  refundId: string,
  rejectionReason?: string
): Promise<IrequestRefund | null> => {
  console.log("RefundID", refundId);
  if (!Types.ObjectId.isValid(refundId)) {
    throw new Error("Invalid refund request ID");
  }

  try {
    // Find the refund request first
    const refundRequest = await RequestRefund.findOne({ orderId: refundId });
    console.log("request ", refundRequest);

    if (!refundRequest) {
      throw new Error("Refund request not found");
    }

    // Check if already rejected
    if (refundRequest.isRejected) {
      throw new Error("Refund request is already rejected");
    }

    // Check if it was previously accepted
    if (refundRequest.isAccepted) {
      throw new Error("Cannot reject an already accepted refund request");
    }

    // Update isRejected to true and add rejection details
    const updateData: any = {
      isRejected: true,
      rejectedAt: new Date(),
    };

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    const updatedRefundRequest = await RequestRefund.findOneAndUpdate(
      { orderId: refundId },
      { $set: updateData },
      { new: true }
    );

    // Update order status to reflect rejection
    await Order.findByIdAndUpdate(
      refundId,
      {
        status: "return_rejected",
        "statusDates.returnRejectedAt": new Date(),
      },
      { new: true }
    );

    return updatedRefundRequest;
  } catch (error: any) {
    throw new Error(`Failed to reject refund request: ${error.message}`);
  }
};

export const RequestRefundService = {
  createRefundRequest,
  getRefundRequestByIdService,
  acceptRefundRequest,
  rejectRefundRequest,
};
