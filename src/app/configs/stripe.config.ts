
import Stripe from "stripe";
import { configs } from "./index";

if (!configs.stripe.secret_key) {
  throw new Error("Stripe secret key is missing in environment variables!");
}

export const stripe = new Stripe(configs.stripe.secret_key);
