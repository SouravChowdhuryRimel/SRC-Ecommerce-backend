// src/modules/subscription/subscription.controller.ts
import { Request, Response } from "express";
import { subscriptionService } from "./subscription.service";

/**
 * POST /api/subscriptions
 */
const createSubscriptionController = async (
  req: Request,
  res: Response
) => {
  try {
    const newPlan = await subscriptionService.createSubscriptionService(
      req.body
    );
    res.status(201).json({
      success: true,
      message: "Subscription plan created successfully. Please update manually product pricing in Stripe Dashboard.",
      data: newPlan,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/subscriptions
 */
const getAllSubscriptionsController = async (
  req: Request,
  res: Response
) => {
  try {
    const plans = await subscriptionService.getAllSubscriptionsService();
    res.status(200).json({
      success: true,
      message: "Subscription plans fetched successfully",
      data: plans,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/subscriptions/:id
 */
const getSubscriptionByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const plan = await subscriptionService.getSubscriptionByIdService(
      req.params.id
    );
    if (!plan)
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    res.status(200).json({
      success: true,
      message: "Subscription plan fetched successfully",
      data: plan,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/subscriptions/:id
 */
const updateSubscriptionController = async (
  req: Request,
  res: Response
) => {
  try {
    const updatedPlan = await subscriptionService.updateSubscriptionService(
      req.params.id,
      req.body
    );
    if (!updatedPlan)
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    res.status(200).json({
      success: true,
      message: "Subscription plan updated successfully",
      data: updatedPlan,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/subscriptions/:id
 */
const deleteSubscriptionController = async (
  req: Request,
  res: Response
) => {
  try {
    const deletedPlan = await subscriptionService.deleteSubscriptionService(
      req.params.id
    );
    if (!deletedPlan)
      return res
        .status(404)
        .json({ success: false, message: "Plan not found" });
    res.status(200).json({
      success: true,
      message: "Subscription plan deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const subscriptionController = {
  createSubscriptionController,
  getAllSubscriptionsController,
  getSubscriptionByIdController,
  updateSubscriptionController,
  deleteSubscriptionController,
};
