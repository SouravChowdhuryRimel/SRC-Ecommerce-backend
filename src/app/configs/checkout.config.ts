// // import { Checkout } from "checkout-sdk-node";
// // import dotenv from "dotenv";

// // dotenv.config();

// // if (!process.env.CHECKOUT_SECRET_KEY) {
// //   throw new Error("CHECKOUT_SECRET_KEY is not defined in .env");
// // }

// // export const checkout = new Checkout(process.env.CHECKOUT_SECRET_KEY!);
// // config/paymentGateway.ts
// // config/paymentGateway.ts

// // import { Checkout } from 'checkout-sdk-node';

// const checkoutConfig: any = {
//   pk: process.env.CHECKOUT_PUBLIC_KEY,
//   environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox'
// };

// // Add processing channel as header
// if (process.env.CHECKOUT_PROCESSING_CHANNEL_ID) {
//   checkoutConfig.headers = {
//     'Cko-Processing-Channel': process.env.CHECKOUT_PROCESSING_CHANNEL_ID
//   };
// }

// export const checkout = new Checkout(process.env.CHECKOUT_SECRET_KEY, checkoutConfig);
