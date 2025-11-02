import { Router } from "express";
import { OrderController } from "./order.controller";

const router = Router();

router.post("/create", OrderController.createOrder); // Create Order
router.get("/getAll", OrderController.getAllOrders); // Get All Orders
router.get("/get-single/:id", OrderController.getOrderById); // Get Single Order
router.put("/update/:id", OrderController.updateOrder); // Update Order
router.put("/update-status/:orderId", OrderController.updateOrderStatus); // Update Order Status

router.get("/current-orders/:userId", OrderController.getCurrentOrders);

// Get all previous orders for a user
router.get("/previous-orders/:userId", OrderController.getPreviousOrders);

// Get order statistics
router.get("/statistics/:userId", OrderController.getUserOrderStatistics);

// Admin statistics route - returns only 4 metrics
router.get("/admin/statistics", OrderController.getAdminStatistics);

//admin Order status counts route
router.get(
  "/order-status-counts/:sellerId",
  OrderController.getOrderStatusCountsBySellerController
);

// Order status summary route
router.get("/status-summary", OrderController.getOrderStatusSummary);

// Activity list route
router.get("/admin/activities-list", OrderController.getActivityList);

// Seller Analytics
router.get("/seller-analytics/:userId", OrderController.getUserStatistics);

// Product list with delivery status base on seller ID
router.get(
  "/seller/:sellerId",
  OrderController.getProductListWithStatusBySellerId
);
// Seller orders routes - using userId
router.get(
  "/seller/recent/:userId",
  OrderController.getRecentOrdersForSellerController
);
// GET /api/v1/order/seller/:sellerId/statistics
router.get(
  "/seller/statistics/:sellerId",
  OrderController.getSellerStatisticsController
);
// Seller order statistic
router.get("/seller-statistics/:sellerId", OrderController.getSellerOrderStatisticsController);

export const OrderRoute = router;
