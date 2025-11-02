import express, { Request, Response } from "express";
import { paymentController } from "./payment.controller";
import auth from "../../middlewares/auth";
import { checkUserSubscription } from "../../middlewares/subscriptionCheck";
import { configs } from "../../configs";

const router = express.Router();

// Regullar Payment
router.post(
  "/checkout",
  // auth("Admin", "Buyer", "Seller"),
  paymentController.createCheckoutSession
);

// Subscription Payment
router.post(
  "/subscription/create",
  // auth("Admin", "Seller"),
  checkUserSubscription,
  paymentController.createSubscriptionSession
);
// router.post(
//   "/checkout/subscription",
//   checkUserSubscription,
//   paymentController.createSubscriptionController
// );
// Checkout direct payment Buyer to Seller
// router.post(
//   "/checkout-direct-payment/create",
//   paymentController.createDirectPaymentController
// );
// Get total subscription amount
// router.get(
//   "/subscription/total",
//   paymentController.getTotalSubscriptionAmountController
// );

// Refund payment
// router.post("/refund", paymentController.refundPaymentController);

router.post("/stripe/refund", paymentController.processStripeRefund);


export const paymentRoutes = router;
