import express, { Request, Response } from "express";
import cors from "cors";
import globalErrorHandler from "./app/middlewares/global_error_handler";
import notFound from "./app/middlewares/not_found_api";
import cookieParser from "cookie-parser";
import appRouter from "./routes";
import { User_Model } from "./app/modules/user/user.schema";
import bcrypt from "bcrypt";
import { configs } from "./app/configs";
import { paymentRoutes } from "./app/modules/payment/payment.route";
import { stripe } from "./app/configs/stripe.config";
import { Payment } from "./app/modules/payment/payment.model";
import { Order } from "./app/modules/order/order.model";
import status from "http-status";
import cron from "node-cron";
import { PromotionModel } from "./app/modules/promotion/promotion.model";

// define app
const app = express();

// middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://flourishing-jelly-660e29.netlify.app",
      "https://main.d1h1ac7dvpczq8.amplifyapp.com",
    ],
  })
);
app.use(express.json({ limit: "100mb" }));
app.use(express.raw());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1", appRouter);

// stating point
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Server is running successful !!",
    data: null,
  });
});

cron.schedule("0 0 * * *", async () => {
  const now = new Date();
  await PromotionModel.updateMany(
    { endDate: { $lt: now }, isActive: true },
    { $set: { isActive: false } }
  );
  console.log("✅ Expired promotions automatically deactivated");
});

// ✅ Success payment route
app.get("/payment-success", async (req: Request, res: Response) => {
  try {
    const { session_id, stripe_account_id } = req.query;

    console.log("Payment success called with session_id:", session_id);

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: "Session ID required",
      });
    }

    // Retrieve session with the correct account context
    let session;
    if (stripe_account_id) {
      session = await stripe.checkout.sessions.retrieve(session_id as string, {
        stripeAccount: stripe_account_id as string,
      });
    } else {
      session = await stripe.checkout.sessions.retrieve(session_id as string);
    }

    if (session.payment_status !== "paid") {
      return res.status(200).json({
        success: false,
        message: "Payment not completed",
        session,
      });
    }

    const actualAmount = session.amount_total ? session.amount_total / 100 : 0;

    // Update payment status AND amount
    const payment = await Payment.findOneAndUpdate(
      { paymentIntentId: session.id },
      {
        paymentStatus: "succeeded",
        amount: actualAmount, // Update with actual amount from Stripe
        paidAt: new Date(),
      },
      { new: true }
    );

    console.log("Payment console:", payment);

    // 🔥 NEW: Handle subscription payment - Update user plan
    if (payment?.isSubscription && payment?.userId) {
      // Type-safe property access with proper checking
      const paymentData = payment as any;
      const userId = paymentData.userId;
      const plan = paymentData.plan;
      const productAddedPowerQuantity = paymentData.productAddedPowerQuantity;

      // Check if required fields exist
      if (!plan) {
        console.warn(
          "Plan is undefined for subscription payment:",
          payment._id
        );
        return res.status(400).json({
          success: false,
          message: "Subscription plan information missing",
        });
      }

      // Calculate subscription expiry date
      const subscriptionExpiryDate = new Date();
      const isYearly = plan.endsWith("Yearly");

      if (isYearly) {
        subscriptionExpiryDate.setFullYear(
          subscriptionExpiryDate.getFullYear() + 1
        );
      } else {
        subscriptionExpiryDate.setMonth(subscriptionExpiryDate.getMonth() + 1);
      }

      // Update user with subscription details
      await User_Model.findByIdAndUpdate(
        userId,
        {
          $set: {
            isPaidPlan: true,
            paidPlan: plan,
            subscribtionPlan: plan,
            productAddedPowerQuantity: productAddedPowerQuantity,
            subscriptionExpiryDate: subscriptionExpiryDate,
            subscriptionUpdatedAt: new Date(),
          },
        },
        { new: true }
      );

      console.log(
        `✅ User ${userId} upgraded to plan: ${plan} update productAddedPowerQuantity to ${productAddedPowerQuantity}`
      );
    }

    // Handle order payment (existing code)
    let order = null;
    const orderId = session.metadata?.orderId;
    if (orderId && (!payment || !payment?.isSubscription)) {
      const transactionId =
        (session.payment_intent as string) || (session.id as string);
        console.log("Updating order with transactionId:", transactionId);
      order = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            status: "payment_processed",
            "statusDates.payment_processed": new Date(),
            paymentStatus: "paid",
            paymentInfo: {
              paymentStatus: "paid",
              transactionId: transactionId,
            },
          },
        },
        { new: true }
      ).populate("items.productId");
    }

    // 🔹 Transfer to sellers (only for order payments, not subscriptions)
    if (session.metadata?.sellers && !payment?.isSubscription) {
      const sellers = JSON.parse(session.metadata.sellers);

      for (const { stripeAccountId, amount, sellerId, orderId } of sellers) {
        try {
          const destAccount = await stripe.accounts.retrieve(stripeAccountId);

          if (destAccount.capabilities?.transfers !== "active") {
            console.warn(
              `Transfers capability not enabled for account ${stripeAccountId}`
            );
            continue;
          }

          await stripe.transfers.create({
            amount: Math.round(amount * 100),
            currency: session.currency || "aed",
            destination: stripeAccountId,
            metadata: { orderId, sellerId },
          });
        } catch (err) {
          console.error(
            `Failed to transfer to seller ${sellerId}:`,
            (err as Error).message
          );
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: payment?.isSubscription
        ? "Subscription payment successful"
        : "Payment successful and transfers attempted",
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
      },
      ...(payment && { payment }), // Only include payment if it exists
      ...(order && { order }), // Only include order if it exists
    });
  } catch (error) {
    console.error("Payment success error:", error);
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    });
  }
});

// ❌ Payment failed route (only session_id provided)
app.get("/payment-failed", async (req: Request, res: Response) => {
  try {
    const { session_id } = req.query;

    console.log("❌ Payment failed called with session_id:", session_id);

    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required",
      });
    }

    // Find the payment by session ID (Stripe checkout session ID)
    const payment = await Payment.findOneAndUpdate(
      { paymentIntentId: session_id },
      {
        $set: {
          paymentStatus: "failed",
          failedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!payment) {
      console.warn("⚠️ No payment found for session_id:", session_id);
      return res.status(404).json({
        success: false,
        message: "Payment not found for this session",
      });
    }

    // If this payment is linked to an order, mark that order as failed
    if (payment.orderId) {
      await Order.findByIdAndUpdate(payment.orderId, {
        $set: {
          status: "payment_failed",
          paymentStatus: "failed",
          "statusDates.payment_failed": new Date(),
        },
      });
    }

    return res.status(200).json({
      success: false,
      message: "Payment failed or canceled",
      sessionId: session_id,
      ...(payment.orderId && { orderId: payment.orderId }),
    });
  } catch (error) {
    console.error("❌ Payment failed route error:", error);
    res.status(500).json({
      success: false,
      message:
        (error as Error).message ||
        "Something went wrong while handling failure",
    });
  }
});

// Create Default SuperAdmin if not exists
export const createDefaultSuperAdmin = async () => {
  try {
    const existingAdmin = await User_Model.findOne({
      email: "souravchowdhury6519@gmail.com",
    });

    const hashedPassword = await bcrypt.hash(
      "admin@123", // Default password for Admin
      Number(configs.bcrypt_salt_rounds) // Ensure bcrypt_salt_rounds is correctly pulled from config
    );

    if (!existingAdmin) {
      await User_Model.create({
        name: "Sourav",
        email: "souravchowdhury6519@gmail.com",
        password: hashedPassword,
        confirmPassword: hashedPassword,
        role: "Admin",
        country: "Global",
      });
      console.log("✅ Default Admin created.");
    } else {
      console.log("ℹ️ SAdmin already exists.");
    }
  } catch (error) {
    console.error("❌ Failed to create Default Admin:", error);
  }
};

createDefaultSuperAdmin();

// global error handler
app.use(globalErrorHandler);
app.use(notFound);

// export app
export default app;
