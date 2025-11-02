// src/modules/subscription/subscription.service.ts
import { Subscription } from "./subscription.model";
import { ISubscription } from "./subscription.interface";

/**
 * ✅ Create a new subscription plan
 */
const createSubscriptionService = async (payload: ISubscription) => {
  const newPlan = await Subscription.create(payload);
  return newPlan;
};

/**
 * ✅ Get all subscription plans
 */
const getAllSubscriptionsService = async () => {
  return await Subscription.find().sort({ createdAt: 1 });
};

/**
 * ✅ Get a single subscription by ID
 */
const getSubscriptionByIdService = async (id: string) => {
  return await Subscription.findById(id);
};

/**
 * ✅ Update a subscription plan
 */
const updateSubscriptionService = async (
  id: string,
  payload: Partial<ISubscription>
) => {
  return await Subscription.findByIdAndUpdate(id, payload, { new: true });
};

/**
 * ✅ Delete a subscription plan
 */
const deleteSubscriptionService = async (id: string) => {
  return await Subscription.findByIdAndDelete(id);
};

export const subscriptionService = {
  createSubscriptionService,
  getAllSubscriptionsService,
  getSubscriptionByIdService,
  updateSubscriptionService,
  deleteSubscriptionService,
};
