// src/modules/subscription/subscription.route.ts
import express from "express";
import { subscriptionController } from "./subscription.controller";

const router = express.Router();

// POST → create new plan
router.post("/create", subscriptionController.createSubscriptionController);

// GET → all plans
router.get("/getAll", subscriptionController.getAllSubscriptionsController);

// GET → single plan by ID
router.get("/getSingleId/:id", subscriptionController.getSubscriptionByIdController);

// PUT → update plan
router.put("/update/:id", subscriptionController.updateSubscriptionController);

// DELETE → delete plan
router.delete("/delete/:id", subscriptionController.deleteSubscriptionController);

export const subscriptionRoutes = router;
