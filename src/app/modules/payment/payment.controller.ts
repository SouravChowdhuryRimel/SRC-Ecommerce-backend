import { Request, Response } from "express";
import { createCheckoutSessionService, createSubscriptionSessionService, processStripeRefundService } from "./payment.service";
import { stripe } from "../../configs/stripe.config";
import { configs } from "../../configs";
import { Payment } from "./payment.model";
import { Order } from "../order/order.model";
import { User_Model } from "../user/user.schema";
import { cleanRegex } from "zod/v4/core/util.cjs";
// import { createDirectPaymentForMultipleSellers, refundPaymentService } from "./directPayment.service";

const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const url = await createCheckoutSessionService(orderId,);
    res.status(200).json({ success: true, url });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
};

// Subscription controller
const createSubscriptionSession = async (req: Request, res: Response) => {
  try {
    const { userId, plan } = req.body;

    // console.log(userId, 'lksdlfjsdklf -----------------')

    const isUserExist = await User_Model.findById(userId)

    if(isUserExist?.role !== 'Seller'){
        throw new Error ('Only the Seller can buy the subscription');
    }



    if (!userId || !plan) {
      return res.status(400).json({
        success: false,
        message: "userId and plan are required",
      });
    }

    const url = await createSubscriptionSessionService(userId, plan);
    res.status(200).json({ success: true, url });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
};
// payment.controller.ts
// const createSubscriptionController = async (req: Request, res: Response) => {
//   try {
//     const { userId, plan, card } = req.body;

//     if (!userId || !plan || !card) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Missing required fields: userId, plan, or card" 
//       });
//     }

//     // Validate card details
//     if (!card.number || !card.expiry_month || !card.expiry_year || !card.cvv) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid card details"
//       });
//     }

//     const subscription = await createSubscriptionService(userId, plan, card);

//     return res.status(200).json({ 
//       success: true, 
//       data: subscription 
//     });
//   } catch (error: any) {
//     console.error("🔴 Subscription Error Details:");
//     console.error("Message:", error.message);
//     console.error("Stack:", error.stack);
//     console.error("Full Error:", JSON.stringify(error, null, 2));
    
//     // Check for specific error types
//     if (error.message?.includes("Invalid plan")) {
//       return res.status(400).json({
//         success: false,
//         message: error.message
//       });
//     }
    
//     if (error.message?.includes("User not found")) {
//       return res.status(404).json({
//         success: false,
//         message: error.message
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal Server Error",
//       // Only include details in development
//       ...(process.env.NODE_ENV === 'development' && {
//         details: error.response?.data || error.stack
//       })
//     });
//   }
// };
// const createDirectPaymentController = async (req: Request, res: Response) => {
//   try {
//     const { orderId, card } = req.body;

//     if (!orderId || !card) {
//       return res.status(400).json({
//         success: false,
//         message: "orderId and card information are required",
//       });
//     }

//     const result = await createDirectPaymentForMultipleSellers(orderId, card);

//     res.status(200).json({
//       success: true,
//       message: "Payments processed successfully",
//       data: result,
//     });
//   } catch (error: any) {
//     console.error("❌ Controller Error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message || "Server error",
//     });
//   }
// };
// const getTotalSubscriptionAmountController = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const result = await getTotalSubscriptionAmountService();
//     res.status(200).json({
//       success: true,
//       message: "Total subscription amount fetched successfully",
//       data: result,
//     });
//   } catch (error: any) {
//     console.error("Error fetching total subscription amount:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server Error",
//       error: error.message,
//     });
//   }
// };

// const refundPaymentController = async (req: Request, res: Response) => {
//   try {
//     const { orderId } = req.body;
//     if (!orderId) return res.status(400).json({ success: false, message: "orderId is required" });

//     const result = await refundPaymentService(orderId);
//     return res.status(result.success ? 200 : 400).json(result);
//   } catch (err: any) {
//     return res.status(500).json({ success: false, message: err.message || "Server error" });
//   }
// };

// ✅ Process Stripe Refund (Admin)
const processStripeRefund = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const result = await processStripeRefundService(orderId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Process Stripe refund controller error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const paymentController = {
  createCheckoutSession,
  createSubscriptionSession,
  // createSubscriptionController,
  // createDirectPaymentController,
  // getTotalSubscriptionAmountController,
  // refundPaymentController,
  processStripeRefund,

}