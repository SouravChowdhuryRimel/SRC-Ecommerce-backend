// // import { Checkout } from "checkout-sdk-node";
// import { Payment } from "./payment.model";
// import { User_Model } from "../user/user.schema";
// import { Order } from "../order/order.model";
// import { Product } from "../products/products.model";
// import { Cart } from "../cart/cart.model";

// // Map Checkout payment statuses to our Payment.paymentStatus enum
// const mapCheckoutStatusToPaymentStatus = (status?: string) => {
//   if (!status) return "pending";
//   const s = String(status).toLowerCase();
//   if (
//     s.includes("auth") ||
//     s.includes("paid") ||
//     s.includes("captur") ||
//     s.includes("succe") ||
//     s.includes("approved") ||
//     s.includes("authorised") ||
//     s.includes("authorized")
//   )
//     return "succeeded";
//   if (
//     s.includes("declin") ||
//     s.includes("fail") ||
//     s.includes("refus") ||
//     s.includes("error") ||
//     s.includes("rejected")
//   )
//     return "failed";
//   return "pending";
// };

// // Minimal seller credential validator used by the direct payment flow
// const validateSellerCredentials = (seller: any) => {
//   if (!seller) return { isValid: false, error: "Seller not found" };
//   if (!seller.checkoutSecretKey || !seller.checkoutProcessingChannelId) {
//     return { isValid: false, error: "Missing Checkout credentials" };
//   }

//   const isSandboxKey =
//     typeof seller.checkoutSecretKey === "string" &&
//     seller.checkoutSecretKey.startsWith("sk_sbox_");
//   const isLiveKey =
//     typeof seller.checkoutSecretKey === "string" &&
//     seller.checkoutSecretKey.startsWith("sk_live_");
//   if (!isSandboxKey && !isLiveKey) {
//     return {
//       isValid: false,
//       error:
//         "Invalid secret key format - must start with 'sk_sbox_' or 'sk_live_'",
//     };
//   }

//   return { isValid: true, environment: isSandboxKey ? "sandbox" : "live" };
// };

// export const createDirectPaymentForMultipleSellers = async (
//   orderId: string,
//   card: {
//     number: string;
//     expiry_month: number;
//     expiry_year: number;
//     cvv: string;
//   }
// ) => {
//   const order = await Order.findById(orderId).populate("items.productId");
//   if (!order) throw new Error("Order not found");

//   // Group items by seller
//   const sellerTotals = new Map<string, number>();
//   for (const item of order.items) {
//     const product: any = item.productId;
//     if (!product?.userId) continue;
//     const sellerId = product.userId.toString();
//     const itemTotal = item.price * item.quantity;
//     sellerTotals.set(sellerId, (sellerTotals.get(sellerId) || 0) + itemTotal);
//   }

//   if (sellerTotals.size === 0) throw new Error("No sellers found");

//   const paymentResults: any[] = [];

//   // DEBUG: log computed seller totals (helps explain empty payments array)
//   try {
//     const sellersDebug: any[] = [];
//     for (const [sId, amt] of sellerTotals.entries())
//       sellersDebug.push({ sellerId: sId, amount: amt });
//     console.log(
//       "Computed seller totals:",
//       JSON.stringify(sellersDebug, null, 2)
//     );
//   } catch (e) {
//     console.warn("Failed to log seller totals", e);
//   }
//   for (const [sellerId, amount] of sellerTotals.entries()) {
//     const seller = await User_Model.findById(sellerId);
//     if (!seller) {
//       // Instead of silently skipping, record a failed payment so caller sees why no payments were processed
//       console.warn(`Seller not found for id ${sellerId}`);
//       paymentResults.push({
//         sellerId,
//         sellerEmail: null,
//         amount,
//         success: false,
//         error: "Seller not found in users collection",
//       });
//       continue;
//     }

//     const credentialCheck = validateSellerCredentials(seller);
//     if (!credentialCheck.isValid) {
//       console.warn(
//         `Missing checkout credentials for seller ${seller?.email || sellerId}`
//       );
//       paymentResults.push({
//         sellerEmail: seller?.email || sellerId,
//         amount,
//         success: false,
//         error: credentialCheck.error,
//       });
//       continue;
//     }

//     try {
//       console.log("=== PAYMENT DEBUG START ===");
//       console.log("Seller:", seller.email);

//       const derivedEnvironment = credentialCheck.environment;
//       console.log("Derived environment from key:", derivedEnvironment);

//       const checkout = new Checkout(seller.checkoutSecretKey, {
//         environment: derivedEnvironment,
//         headers: {
//           "Cko-Processing-Channel": seller.checkoutProcessingChannelId,
//         },
//       } as any);

//       // SKIP TOKENIZATION - Use direct card payment
//       console.log("🔹 Using direct card payment (bypassing tokenization)...");

//       const amountInCents = Math.round(amount * 100);
//       console.log("Amount:", amount, "->", amountInCents, "cents");

//       // Build payload
//       const paymentPayload: any = {
//         source: {
//           type: "card",
//           number: card.number.replace(/\s/g, ""),
//           expiry_month: card.expiry_month,
//           expiry_year: card.expiry_year,
//           cvv: card.cvv,
//           name: "Customer",
//           billing_address: {
//             address_line1: "Not Provided",
//             city: "Dubai",
//             country: "AE",
//           },
//         },
//         amount: amountInCents,
//         currency: order.currency?.toUpperCase() || "AED",
//         capture: true,
//         reference: `order_${orderId}_${sellerId}_${Date.now()}`,
//         metadata: { orderId, sellerId, sellerEmail: seller.email },
//         processing_channel_id: seller.checkoutProcessingChannelId,
//         "3ds": { enabled: false },
//       };

//       // Log payload masked by default
//       try {
//         const unmask = process.env.CHECKOUT_DEBUG_UNMASK === "true";
//         const payloadForLog: any = JSON.parse(JSON.stringify(paymentPayload));
//         if (!unmask) {
//           if (payloadForLog.source?.number)
//             payloadForLog.source.number = payloadForLog.source.number.replace(
//               /.(?=.{4})/g,
//               "*"
//             );
//           if (payloadForLog.processing_channel_id)
//             payloadForLog.processing_channel_id = `${payloadForLog.processing_channel_id.slice(
//               0,
//               6
//             )}...`;
//         }
//         console.log(
//           "Outgoing payment payload:",
//           JSON.stringify(payloadForLog, null, 2)
//         );
//       } catch (logErr) {
//         console.warn("Failed to log payment payload", logErr);
//       }

//       const paymentRes: any = await checkout.payments.request(paymentPayload);

//       console.log("✅ Payment Response Received");
//       console.log("Payment ID:", paymentRes.id);
//       console.log("Payment Status:", paymentRes.status);
//       console.log("Approved:", paymentRes.approved);

//       // Map status and save
//       const mappedStatus = mapCheckoutStatusToPaymentStatus(paymentRes.status);

//       const res = await Payment.create({
//         // link payment to the originating order so refunds can derive seller/order later
//         orderId: order._id,
//         userId: order.userId,
//         sellerId,
//         amount,
//         currency: order.currency?.toUpperCase() || "AED",
//         paymentIntentId: paymentRes.id,
//         paymentStatus: mappedStatus,
//         paymentDate: new Date(),
//         mode: "payment",
//       });

//       paymentResults.push({
//         sellerEmail: seller.email,
//         amount,
//         success: true,
//         paymentId: paymentRes.id,
//         status: paymentRes.status,
//         mappedStatus,
//         approved: paymentRes.approved,
//       });

//       if (res) {
//         for (const item of order.items) {
//           const product: any = item.productId;

//           const updatedProduct = await Product.findOneAndUpdate(
//             { _id: product._id }, // or { _id: productId }
//             { $inc: { salesCount: 1 } },
//             { new: true } // returns the updated document
//           );

//           console.log("pproduct", updatedProduct);
//           // ✅ Update order status and save
//           order.status = "payment_processed";
//           order.statusDates = {
//             ...order.statusDates,
//             payment_processed: new Date(),
//           };
//           order.paymentInfo = {
//             ...order.paymentInfo,
//             paymentStatus: "paid",
//             transactionId: paymentRes.id,
//             paymentDate: new Date(),
//             cardLast4: paymentRes?.source?.last4 || order.paymentInfo?.cardLast4,
//           };
//           await order.save();

//           // ✅ Remove cart after payment
//           await Cart.updateOne(
//             { userId: order.userId },
//             {
//               $pull: {
//                 items: {
//                   productId: {
//                     $in: order.items.map((i: any) => i.productId._id),
//                   },
//                 },
//               },
//             }
//           );
//           console.log(
//             `🧹 Removed purchased products from cart for user ${order.userId}`
//           );
//         }
//       }

//       console.log("=== PAYMENT DEBUG END ===");
//     } catch (err: any) {
//       console.error("❌ PAYMENT ERROR DETAILS:");
//       console.error("Error Message:", err?.message || err);
//       console.error("Error HTTP Code:", err?.http_code);
//       if (err?.body)
//         console.error("Error Body:", JSON.stringify(err.body, null, 2));

//       paymentResults.push({
//         sellerEmail: seller.email,
//         amount,
//         success: false,
//         error: err?.message || String(err),
//         httpCode: err?.http_code,
//       });
//     }
//   }

//   return {
//     success: paymentResults.some((p) => p.success),
//     message: "Payments processed",
//     data: { orderId, payments: paymentResults },
//   };
// };



// // Payment refund
// // export const refundPaymentService = async (
// //   paymentIntentId: string,
// //   amount?: number
// // ) => {
// //   // 1️⃣ Find payment in DB
// //   const payment = await Payment.findOne({ paymentIntentId });
// //   if (!payment) throw new Error("Payment not found");

// //   // 2️⃣ Get seller to access their Checkout credentials
// //   // Prefer sellerId on the payment record; if missing, try to derive from the order linked to the payment
// //   let sellerId = (payment as any).sellerId;
// //   if (!sellerId && (payment as any).orderId) {
// //     try {
// //       const order = await Order.findById((payment as any).orderId);
// //       if (order && Array.isArray(order.items) && order.items.length) {
// //         // Try to determine sellerId from items. For robustness, if items' productId
// //         // are not populated we will query Product by id to get its userId.
// //         for (const it of order.items) {
// //           const productRef: any = it.productId;
// //           let productDoc: any = null;
// //           // If productId is an object (populated), use it
// //           if (productRef && typeof productRef === "object" && productRef._id) {
// //             productDoc = productRef;
// //           } else if (productRef) {
// //             // productRef is likely an ObjectId; fetch the product
// //             try {
// //               productDoc = await Product.findById(productRef);
// //             } catch (e) {
// //               // continue to next item
// //               console.warn("Failed to load product while deriving sellerId", e);
// //             }
// //           }

// //           if (productDoc && productDoc.userId) {
// //             sellerId = String(productDoc.userId);
// //             break;
// //           }
// //         }

// //         // If we found a sellerId, persist it on the payment so future refunds don't need to derive
// //         if (sellerId) {
// //           try {
// //             (payment as any).sellerId = sellerId;
// //             await payment.save();
// //           } catch (e) {
// //             console.warn("Failed to backfill sellerId on payment", e);
// //           }
// //         }
// //       }
// //     } catch (e) {
// //       console.warn("Failed to derive seller from order", e);
// //     }
// //   }

// //   const seller = sellerId ? await User_Model.findById(sellerId) : null;
// //   if (!seller) {
// //     // helpful error message for debugging
// //     console.error(`Seller not found for payment ${paymentIntentId}. payment.sellerId=${(payment as any).sellerId}, derivedSellerId=${sellerId}`);
// //     throw new Error("Seller not found");
// //   }

// //   if (!seller.checkoutSecretKey) throw new Error("Missing Checkout secret key");

// //   const isSandbox = seller.checkoutSecretKey.startsWith("sk_sbox_");
// //   const environment = isSandbox ? "sandbox" : "live";

// //   // 3️⃣ Initialize Checkout client
// //   const checkout = new Checkout(seller.checkoutSecretKey, {
// //     environment,
// //     headers: {
// //       "Cko-Processing-Channel": seller.checkoutProcessingChannelId,
// //     },
// //   } as any);

// //   try {
// //     console.log("🔄 Initiating refund...");
// //     const refundPayload: any = {
// //       reference: `refund_${paymentIntentId}_${Date.now()}`,
// //       metadata: { paymentIntentId, sellerId: seller._id },
// //     };

// //     // Optional partial refund (amount in smallest unit)
// //     if (amount) {
// //       refundPayload.amount = Math.round(amount * 100);
// //     }

// //     // 4️⃣ Send refund request
// //     const refundResponse: any = await checkout.payments.refund(paymentIntentId, refundPayload);

// //     console.log("✅ Refund response:", refundResponse);

// //     // 5️⃣ Map refund status
// //     // Checkout refund responses can differ between SDK versions/environments.
// //     // Older/newer responses may not include `approved` but include an `action_id`,
// //     // a `status` string, or `_links`. Treat presence of action_id or common
// //     // successy status values as a successful refund.
// //     let refundApproved = false;
// //     try {
// //       if (refundResponse?.approved === true) refundApproved = true;
// //       else if (refundResponse?.action_id) refundApproved = true;
// //       else if (refundResponse?._links && refundResponse._links.payment) refundApproved = true;
// //       else if (typeof refundResponse?.status === "string") {
// //         const s = refundResponse.status.toLowerCase();
// //         if (['approved', 'succeeded', 'success', 'captured', 'completed', 'accepted'].includes(s)) refundApproved = true;
// //       }
// //     } catch (e) {
// //       console.warn('Failed to assess refund response shape', e);
// //     }

// //     const refundStatus = refundApproved ? "refunded" : (refundResponse?.status ? `refund_${String(refundResponse.status).toLowerCase()}` : "refund_failed");
// //     const paymentStatus = refundApproved ? "refunded" : "failed";

// //     // 6️⃣ Update payment record
// //     payment.paymentStatus = paymentStatus;
// //     payment.refundInfo = {
// //       refundId: refundResponse?.id || refundResponse?.action_id || null,
// //       amount: amount || (payment as any).amount,
// //       status: refundStatus,
// //       date: new Date(),
// //       providerResponse: refundResponse,
// //     } as any;
// //     await payment.save();

// //     return {
// //       success: !!refundApproved,
// //       message: refundApproved ? "Refund processed (or queued)" : "Refund failed",
// //       data: {
// //         refundId: refundResponse.id || refundResponse.action_id || null,
// //         paymentIntentId,
// //         amount: amount || (payment as any).amount,
// //         status: refundStatus,
// //         providerResponse: refundResponse,
// //       },
// //     };
// //   } catch (err: any) {
// //     console.error("❌ Refund error:", err?.message || err);
// //     return {
// //       success: false,
// //       message: err?.message || "Refund failed",
// //       error: err,
// //     };
// //   }
// // }; 

// export const refundPaymentService = async (orderId: string) => {
//   // 1️⃣ Find payment by orderId
//   const payment = await Payment.findOne({ orderId });
//   if (!payment) throw new Error("Payment not found for this order");

//   const { paymentIntentId, amount, sellerId } = payment;
//   if (!paymentIntentId) throw new Error("Payment Intent ID missing on payment");

//   // 2️⃣ Fetch seller
//   const seller = sellerId ? await User_Model.findById(sellerId) : null;
//   if (!seller) throw new Error("Seller not found");
//   if (!seller.checkoutSecretKey) throw new Error("Seller Checkout secret key missing");

//   const environment = seller.checkoutSecretKey.startsWith("sk_sbox_") ? "sandbox" : "live";

//   // 3️⃣ Initialize Checkout client
//   const checkout = new Checkout(seller.checkoutSecretKey, {
//     environment,
//     headers: {
//       "Cko-Processing-Channel": seller.checkoutProcessingChannelId,
//     },
//   } as any);

//   try {
//     console.log("🔄 Initiating refund for order:", orderId);

//     const refundPayload: any = {
//       reference: `refund_${paymentIntentId}_${Date.now()}`,
//       metadata: { orderId, sellerId: seller._id },
//       amount: Math.round(amount * 100), // full refund
//     };

//     const refundResponse: any = await checkout.payments.refund(paymentIntentId, refundPayload);

//     // Determine refund status
//     const refundApproved =
//       refundResponse?.approved === true ||
//       !!refundResponse?.action_id ||
//       (typeof refundResponse?.status === "string" &&
//         ["approved", "succeeded", "success", "captured", "completed", "accepted"].includes(
//           refundResponse.status.toLowerCase()
//         ));

//     const refundStatus = refundApproved ? "refunded" : "refund_failed";
//     payment.paymentStatus = refundApproved ? "refunded" : "failed";

//     // Update payment document
//     payment.refundInfo = {
//       refundId: refundResponse.id || refundResponse.action_id || null,
//       amount,
//       status: refundStatus,
//       date: new Date(),
//       providerResponse: refundResponse,
//     } as any;

//     await payment.save();

//     return {
//       success: !!refundApproved,
//       message: refundApproved ? "Refund processed successfully" : "Refund failed",
//       data: {
//         paymentId: payment._id,
//         refundId: refundResponse.id || refundResponse.action_id,
//         amount,
//         status: refundStatus,
//         providerResponse: refundResponse,
//       },
//     };
//   } catch (err: any) {
//     console.error("❌ Refund error:", err);
//     return {
//       success: false,
//       message: err?.message || "Refund failed",
//       error: err,
//     };
//   }
// };