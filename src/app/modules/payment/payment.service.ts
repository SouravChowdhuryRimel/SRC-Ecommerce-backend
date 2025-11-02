import { stripe } from "../../configs/stripe.config";
import { configs } from "../../configs";
import { Payment } from "./payment.model";
import { User_Model } from "../user/user.schema";
import { Order } from "../order/order.model";
import { Product } from "../products/products.model";
import { AppError } from "../../utils/app_error";
// import { checkout } from "../../configs/checkout.config";
import { Subscription } from "../subscriptions/subscription.model";

export const createCheckoutSessionService = async (orderId: string) => {
  const order = await Order.findById(orderId).populate("items.productId");
  if (!order) throw new Error("Order not found");

  // 1️⃣ Calculate total per seller
  const sellerTotals = new Map<string, number>();
  for (const item of order.items) {
    const product: any = item.productId;
    if (!product?.userId) continue;
    const sellerId = product.userId.toString();
    const itemTotal = item.price * item.quantity;
    sellerTotals.set(sellerId, (sellerTotals.get(sellerId) || 0) + itemTotal);
  }

  if (sellerTotals.size === 0) throw new Error("No sellers found in order");

  // 2️⃣ Prepare seller account info
  let sellerInfo: {
    sellerId: string;
    stripeAccountId: string;
    amount: number;
  } | null = null;

  for (const [sellerId, amount] of sellerTotals.entries()) {
    const seller = await User_Model.findById(sellerId);
    if (!seller) throw new Error(`Seller not found: ${sellerId}`);

    const stripeAccountId = (seller as any).stripeAccountId;
    if (!stripeAccountId)
      throw new Error(
        `Seller ${seller.email} does not have a connected Stripe account`
      );

    sellerInfo = { sellerId, stripeAccountId, amount };
    break;
  }

  if (!sellerInfo) throw new Error("No seller with valid Stripe account found");

  const totalAmount = Math.round(sellerInfo.amount * 100);

  try {

    const BASE_URL = process.env.FRONTEND_BASE_URL?.trim();
    // 3️⃣ Create checkout session ON the connected account directly
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: order.currency?.toLowerCase() || "aed",
              product_data: {
                name: `Order #${order.orderNumber}`,
              },
              unit_amount: totalAmount,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: Math.round(totalAmount * 0.05),
        },
        success_url: `${configs.jwt.front_end_url}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}&stripe_account_id=${sellerInfo.stripeAccountId}`,
        cancel_url: `${configs.jwt.front_end_url}/payment-failed?order_id=${orderId}`,
        metadata: {
          orderId,
          sellerId: sellerInfo.sellerId,
          stripeAccountId: sellerInfo.stripeAccountId,
        },
      },
      {
        stripeAccount: sellerInfo.stripeAccountId,
      }
    );

    console.log(
      "Checkout session created directly on account:",
      sellerInfo.stripeAccountId
    );
    // 4️⃣ Save payment to Payment model
    const payment = await Payment.create({
      orderId: order._id,
      sellerId: sellerInfo.sellerId,
      amount: totalAmount / 100, // Convert back to dollars
      currency: order.currency?.toLowerCase() || "aed",
      paymentStatus: "pending",
      paymentIntentId: session.id,
      mode: "payment",
      stripeAccountId: sellerInfo.stripeAccountId,
    });

    console.log("✅ Payment record created:", payment._id);

    return {
      sessionUrl: session.url,
      sessionId: session.id,
    };
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return {
      success: false,
      message: error.message || "Failed to create checkout session",
    };
  }
};

// export const createSubscriptionSessionService = async (
//   userId: string,
//   plan: "starter" | "advance" | "starterYearly" | "advanceYearly"
// ) => {
//   // 💰 Plan pricing with Stripe Price IDs (you need to create these in Stripe dashboard)
//   const planConfigs: Record<string, { priceId: string; amount: number }> = {
//     starter: {
//       priceId: "price_1SHcorBw3ruVcJRhndtRuEMG", // Replace with actual Stripe Price ID
//       amount: 6900,
//     },
//     advance: {
//       priceId: "price_1SHggeBw3ruVcJRhpKNDEzeU", // Replace with actual Stripe Price ID
//       amount: 19900,
//     },
//     starterYearly: {
//       priceId: "price_1SJXaqBw3ruVcJRhWtpMFtMY", // Replace with actual Stripe Price ID
//       amount: 69900,
//     },
//     advanceYearly: {
//       priceId: "price_1SJXbQBw3ruVcJRhLysvfEPM", // Replace with actual Stripe Price ID
//       amount: 199900,
//     },
//   };

//   const planConfig = planConfigs[plan];
//   if (!planConfig) {
//     throw new Error(`Invalid plan: ${plan}`);
//   }

//   // Determine product slots based on plan
//   let productAddedPowerQuantity: number | "unlimited";
//   if (plan === "starter") {
//     productAddedPowerQuantity = 20;
//   } else if (plan === "starterYearly") {
//     productAddedPowerQuantity = 240;
//   } else {
//     productAddedPowerQuantity = "unlimited";
//   }

//   let updatedUser = null;

//   // ✅ Update user's paid plan
//   if (userId) {
//     updatedUser = await User_Model.findByIdAndUpdate(
//       userId,
//       {
//         isPaidPlan: true,
//         paidPlan: plan,
//         subscribtionPlan: plan,
//         productAddedPowerQuantity: productAddedPowerQuantity,
//       },
//       { new: true } // return updated user
//     );
//   }

//   // ✅ Create Stripe Checkout Session for SUBSCRIPTION
//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ["card"],
//     mode: "subscription", // Changed from "payment" to "subscription"
//     line_items: [
//       {
//         price: planConfig.priceId, // Use Stripe Price ID instead of price_data
//         quantity: 1,
//       },
//     ],
//     subscription_data: {
//       metadata: {
//         userId,
//         plan,
//         productAddedPowerQuantity: productAddedPowerQuantity.toString(),
//       },
//     },
//     success_url: `${configs.jwt.front_end_url}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${configs.jwt.front_end_url}/payment-failed`,
//     customer_email: updatedUser?.email, // Optional: prefill customer email
//     client_reference_id: userId,
//     metadata: {
//       userId,
//       plan,
//       productAddedPowerQuantity: productAddedPowerQuantity.toString(),
//     },
//   });

//   // ✅ Store pending subscription (NOT update user yet - wait for webhook confirmation)
//   await Payment.create({
//     userId,
//     plan,
//     isSubscription: true,
//     amount: planConfig.amount / 100,
//     currency: "AED",
//     paymentIntentId: session.id,
//     subscriptionId: session.subscription?.toString(), // Store subscription ID
//     paymentStatus: "pending",
//     mode: "subscription",
//   });

//   // ✅ Return session URL for frontend redirect
//   return {
//     sessionUrl: session.url,
//     sessionId: session.id,
//   };
// };

export const createSubscriptionSessionService = async (
  userId: string,
  plan: "starter" | "advance" | "starterYearly" | "advanceYearly"
) => {
  try {
    console.log(`🟡 Starting subscription for user ${userId}, plan: ${plan}`);

    // 🧠 Determine which base plan it belongs to
    const planType =
      plan === "starter" || plan === "starterYearly" ? "starter" : "advance";

    // Fetch plan details from DB
    const planDoc = await Subscription.findOne({
      title: new RegExp(planType, "i"),
    });

    if (!planDoc) {
      throw new Error(`Plan configuration not found for ${planType}`);
    }

    // Determine interval and amount
    const isYearly = plan.endsWith("Yearly");
    const amount = isYearly ? planDoc.priceYearly : planDoc.priceMonthly;
    const interval = isYearly ? "year" : "month";

    // Get user info
    const user = await User_Model.findById(userId);
    if (!user) throw new Error("User not found");

    // Determine product limit based on plan
    let productAddedPowerQuantity: number | "unlimited";
    if (planType === "starter") {
      productAddedPowerQuantity = isYearly
        ? 12 * (planDoc.productAddedPowerQuantity as number)
        : (planDoc.productAddedPowerQuantity as number);
    } else {
      productAddedPowerQuantity = "unlimited";
    }

    // Subscription dates
    const subscriptionUpdatedAt = new Date();
    const subscriptionExpiryDate = new Date();

    if (interval === "month") {
      subscriptionExpiryDate.setMonth(subscriptionExpiryDate.getMonth() + 1);
    } else {
      subscriptionExpiryDate.setFullYear(
        subscriptionExpiryDate.getFullYear() + 1
      );
    }

    // 💰 Plan pricing with Stripe Price IDs
    const planConfigs: Record<string, { priceId: string; amount: number }> = {
      starter: {
        priceId: "price_1SHcorBw3ruVcJRhndtRuEMG",
        amount: planDoc.priceMonthly,
      },
      advance: {
        priceId: "price_1SHggeBw3ruVcJRhpKNDEzeU",
        amount: planDoc.priceMonthly,
      },
      starterYearly: {
        priceId: "price_1SJXaqBw3ruVcJRhWtpMFtMY",
        amount: planDoc.priceYearly,
      },
      advanceYearly: {
        priceId: "price_1SJXbQBw3ruVcJRhLysvfEPM",
        amount: planDoc.priceYearly,
      },
    };

    const planConfig = planConfigs[plan];
    if (!planConfig) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    // ✅ Create Stripe Checkout Session for SUBSCRIPTION
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          userId,
          plan,
          planType,
          productAddedPowerQuantity: productAddedPowerQuantity.toString(),
          subscriptionExpiryDate: subscriptionExpiryDate.toISOString(),
        },
      },
      success_url: `${configs.jwt.front_end_url}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${configs.jwt.front_end_url}/payment-failed`,
      customer_email: user.email,
      client_reference_id: userId,
      metadata: {
        userId,
        plan,
        planType,
        productAddedPowerQuantity: productAddedPowerQuantity.toString(),
        subscriptionExpiryDate: subscriptionExpiryDate.toISOString(),
        interval,
      },
    });

    // ✅ Store pending subscription (wait for webhook confirmation)
    await Payment.create({
      userId,
      plan,
      planType,
      isSubscription: true,
      amount: amount,
      currency: "AED",
      paymentIntentId: session.id,
      subscriptionId: session.subscription?.toString(),
      paymentStatus: "pending",
      mode: "subscription",
      productAddedPowerQuantity,
      subscriptionExpiryDate,
      interval,
    });

    console.log(`✅ Subscription session created for user ${userId}`);

    // ✅ Return session URL for frontend redirect
    return {
      sessionUrl: session.url,
      sessionId: session.id,
      subscriptionExpiryDate,
      productAddedPowerQuantity,
    };
  } catch (error: any) {
    console.error("❌ Subscription session creation error:", error);
    return {
      success: false,
      message: error.message || "Failed to create subscription session",
    };
  }
};

// export const createSubscriptionService = async (
//   userId: string,
//   plan: "starter" | "advance" | "starterYearly" | "advanceYearly",
//   card: {
//     number: string;
//     expiry_month: number;
//     expiry_year: number;
//     cvv: string;
//   }
// ) => {
//   try {
//     console.log(`🟡 Starting subscription for user ${userId}, plan: ${plan}`);

//     // 🧠 Determine which base plan it belongs to
//     const planType =
//       plan === "starter" || plan === "starterYearly" ? "starter" : "advance";

//     // Fetch plan details from DB
//     const planDoc = await Subscription.findOne({
//       title: new RegExp(planType, "i"),
//     });

//     if (!planDoc) {
//       throw new Error(`Plan configuration not found for ${planType}`);
//     }

//     // Determine interval and amount
//     const isYearly = plan.endsWith("Yearly");
//     const amount = isYearly ? planDoc.priceYearly : planDoc.priceMonthly;
//     const interval = isYearly ? "year" : "month";

//     // Get user info
//     const user = await User_Model.findById(userId);
//     if (!user) throw new Error("User not found");

//     // Determine product limit based on plan
//     let productAddedPowerQuantity: number | "unlimited";
//     if (planType === "starter") {
//       productAddedPowerQuantity = isYearly
//         ? 12 * (planDoc.productAddedPowerQuantity as number)
//         : (planDoc.productAddedPowerQuantity as number);
//     } else {
//       productAddedPowerQuantity = "unlimited";
//     }

//     // Subscription dates
//     const subscriptionUpdatedAt = new Date();
//     const subscriptionExpiryDate = new Date();

//     if (interval === "month") {
//       subscriptionExpiryDate.setMonth(subscriptionExpiryDate.getMonth() + 1);
//     } else {
//       subscriptionExpiryDate.setFullYear(
//         subscriptionExpiryDate.getFullYear() + 1
//       );
//     }

//     // ✅ Create card token
//     const tokenRes = (await checkout.tokens.request({
//       type: "card",
//       number: card.number.replace(/\s/g, ""),
//       expiry_month: card.expiry_month,
//       expiry_year: card.expiry_year,
//       cvv: card.cvv,
//     })) as { token: string };

//     if (!tokenRes.token) {
//       throw new Error("Failed to create card token");
//     }

//     // ✅ Process payment
//     const paymentPayload: any = {
//       source: { type: "token", token: tokenRes.token },
//       amount: amount * 100,
//       currency: "AED",
//       capture: true,
//       reference: `sub_${userId}_${Date.now()}`,
//       "3ds": { enabled: false },
//       metadata: { userId, plan, interval },
//     };

//     if (
//       process.env.CHECKOUT_PROCESSING_CHANNEL_ID &&
//       process.env.CHECKOUT_PROCESSING_CHANNEL_ID.startsWith("pc_")
//     ) {
//       paymentPayload.processing_channel_id =
//         process.env.CHECKOUT_PROCESSING_CHANNEL_ID;
//     }

//     const paymentRes = (await checkout.payments.request(paymentPayload)) as {
//       id: string;
//       status: string;
//     };

//     // ✅ Create payment record
//     const paymentRecord = await Payment.create({
//       userId,
//       plan,
//       amount,
//       currency: "AED",
//       paymentIntentId: paymentRes.id,
//       paymentStatus: paymentRes.status === "Captured" ? "succeeded" : "failed",
//       mode: "subscription",
//       paymentDate: new Date(),
//       subscriptionExpiryDate,
//       isSubscription: true,
//     });

//     // ✅ Update user record
//     await User_Model.findByIdAndUpdate(userId, {
//       isPaidPlan: true,
//       paidPlan: plan,
//       subscribtionPlan: plan,
//       productAddedPowerQuantity,
//       subscriptionUpdatedAt,
//       subscriptionExpiryDate,
//       isSubscriptionActive: true,
//     });

//     // ✅ Update payment status if payment captured successfully
//     if (
//       paymentRes.status === "Authorized" ||
//       paymentRes.status === "Captured"
//     ) {
//       paymentRecord.paymentStatus = "succeeded";
//       paymentRecord.amount = amount;
//       await paymentRecord.save();
//     } else {
//       paymentRecord.paymentStatus = "failed";
//       await paymentRecord.save();
//     }

//     return {
//       success: true,
//       message:
//         paymentRes.status === "Authorized" || paymentRes.status === "Captured"
//           ? "Subscription activated successfully"
//           : "Subscription payment failed",
//       subscription: {
//         plan,
//         amount,
//         interval,
//         nextBillingDate: subscriptionExpiryDate.toISOString(),
//         productAddedPowerQuantity,
//       },
//     };
//   } catch (error: any) {
//     console.error("🔴 Service Error:", error);
//     throw new Error(error.message || "Subscription creation failed");
//   }
// };

// export const getTotalSubscriptionAmountService = async () => {
//   const result = await Payment.aggregate([
//     {
//       $match: {
//         isSubscription: true,
//         paymentStatus: "succeeded",
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         totalAmount: { $sum: "$amount" },
//         totalCount: { $sum: 1 },
//       },
//     },
//   ]);

//   return {
//     totalAmount: result[0]?.totalAmount || 0,
//     totalCount: result[0]?.totalCount || 0,
//   };
// };

export const processStripeRefundService = async (orderId: string) => {
  try {
    console.log("🔄 Processing Stripe refund for order:", orderId);

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return {
        success: false,
        message: "Payment not found for this order",
      };
    }

    const { paymentIntentId, amount, currency, paymentStatus, _id, stripeAccountId } = payment;

    // Validate payment
    if (!paymentIntentId) {
      return { success: false, message: "Payment Intent ID missing" };
    }
    if (paymentStatus === "refunded") {
      return { success: false, message: "Payment has already been refunded" };
    }
    if (paymentStatus !== "succeeded") {
      return { success: false, message: "Only successful payments can be refunded" };
    }

    console.log("🔍 Payment details:", {
      paymentIntentId,
      stripeAccountId,
      amount,
      currency
    });

    // Try to find the payment using different methods
    let actualPaymentIntentId: string | null = null;

    // Method 1: Try to retrieve the checkout session
    try {
      console.log("🔄 Method 1: Retrieving checkout session...");
      const sessionOptions = stripeAccountId ? { stripeAccount: stripeAccountId } : undefined;
      const session = await stripe.checkout.sessions.retrieve(paymentIntentId, sessionOptions);
      actualPaymentIntentId = session.payment_intent as string;
      console.log("✅ Found via checkout session:", actualPaymentIntentId);
    } catch (sessionError: any) {
      console.log("❌ Checkout session not found, trying other methods...");
      
      // Method 2: Search for payment intents directly
      try {
        console.log("🔄 Method 2: Searching payment intents...");
        const paymentIntents = await stripe.paymentIntents.search({
          query: `metadata["order_id"]:"${orderId}"`,
        });
        
        if (paymentIntents.data.length > 0) {
          actualPaymentIntentId = paymentIntents.data[0].id;
          console.log("✅ Found via search:", actualPaymentIntentId);
        }
      } catch (searchError: any) {
        console.log("❌ Payment intent search failed:", searchError.message);
      }
    }

    // If we still don't have a payment intent ID, try manual lookup
    if (!actualPaymentIntentId) {
      console.log("🔄 Method 4: Manual payment intent lookup...");
      
      // List recent payment intents and try to find by amount/currency
      const paymentIntents = await stripe.paymentIntents.list({
        limit: 10,
      });

      const matchingIntent = paymentIntents.data.find(intent => 
        intent.amount === Math.round(amount * 100) && 
        intent.currency === currency.toLowerCase()
      );

      if (matchingIntent) {
        actualPaymentIntentId = matchingIntent.id;
        console.log("✅ Found via manual lookup:", actualPaymentIntentId);
      }
    }

    if (!actualPaymentIntentId) {
      return {
        success: false,
        message: `Cannot find payment information in Stripe. Please refund manually. Order: ${orderId}, Amount: ${amount} ${currency}`,
        debug: {
          storedSessionId: paymentIntentId,
          orderId,
          amount,
          currency
        }
      };
    }

    console.log("💰 Final Payment Intent ID:", actualPaymentIntentId);

    // Create refund
    const refundOptions = {
      payment_intent: actualPaymentIntentId,
      amount: Math.round(amount * 100),
      metadata: {
        orderId,
        refundType: "buyer_refund",
      },
      reason: "requested_by_customer" as const,
    };

    console.log("🔄 Creating refund with:", refundOptions);

    let refund;
    if (stripeAccountId) {
      refund = await stripe.refunds.create(refundOptions, { 
        stripeAccount: stripeAccountId 
      });
    } else {
      refund = await stripe.refunds.create(refundOptions);
    }

    console.log("✅ Refund created:", refund.id);

    const refundStatus = refund.status === "succeeded" ? "refunded" : "pending";

    // Update payment record
    await Payment.findByIdAndUpdate(_id, {
      paymentStatus: refundStatus,
      refundInfo: {
        refundId: refund.id,
        amount: amount,
        currency: currency,
        status: refundStatus,
        date: new Date(),
        stripeRefundStatus: refund.status,
        actualPaymentIntentId: actualPaymentIntentId, // Store for future reference
      },
    });

    // Update order status
    await Order.findByIdAndUpdate(orderId, {
      status: "refunded",
      "statusDates.refunded": new Date(),
    });

    return {
      success: refundStatus === "refunded",
      message: refundStatus === "refunded" ? "Refund processed successfully" : "Refund is pending",
      data: {
        refundId: refund.id,
        amount: amount,
        currency: currency,
        status: refundStatus,
        stripeRefundStatus: refund.status,
      },
    };
  } catch (err: any) {
    console.error("❌ Refund error:", err);

    let errorMessage = "Refund failed";
    if (err?.type === "StripeInvalidRequestError") {
      switch (err?.code) {
        case "charge_already_refunded":
          errorMessage = "Payment has already been fully refunded";
          break;
        case "amount_too_large":
          errorMessage = "Refund amount exceeds available balance";
          break;
        case "resource_missing":
          errorMessage = "Payment intent not found";
          break;
        default:
          errorMessage = err.message;
      }
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};