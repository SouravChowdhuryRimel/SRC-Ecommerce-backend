import { Request, Response } from "express";
import { OrderService } from "./order.service";

// Create Order
const createOrder = async (req: Request, res: Response) => {
  try {
    const order = await OrderService.createOrder(req.body);
    res.status(201).json({
      success: true,
      data: {
        orderId: order._id,
        status: order.status,
        items: order.items,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const filter: any = {};

    if (status) {
      if (status === "pending") {
        filter.status = {
          $in: ["placed", "payment_processed", "out_for_delivery", "pending"],
        };
      } else {
        filter.status = status;
      }
    }

    const orders = await OrderService.getAllOrders(filter);

    res.status(200).json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Single Order
const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await OrderService.getOrderById(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Order
const updateOrder = async (req: Request, res: Response) => {
  try {
    const order = await OrderService.updateOrder(req.params.id, req.body);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId;
    const { status } = req.body;

    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Status is required" });
    }

    const updatedOrder = await OrderService.updateOrderStatus(orderId, status);

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
}


const getCurrentOrders = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await OrderService.getCurrentOrdersService(userId);
    
    res.status(200).json({
      success: true,
      message: "Current orders fetched successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch current orders",
    });
  }
};

// 🟣 Get previous orders
const getPreviousOrders = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await OrderService.getPreviousOrdersService(userId);
    res.status(200).json({
      success: true,
      message: "Previous orders fetched successfully",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch previous orders",
    });
  }
};

// Add this to your existing order.controller.ts

const getUserOrderStatistics = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const statistics = await OrderService.getUserOrderStatistics(userId);

    res.status(200).json({
      success: true,
      message: "Order statistics fetched successfully",
      data: statistics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order statistics",
    });
  }
};

const getAdminStatistics = async (req: Request, res: Response) => {
  try {
    const statistics = await OrderService.getAdminStatisticsService();

    res.status(200).json({
      success: true,
      message: "Admin statistics retrieved successfully",
      data: statistics,
    });
  } catch (error) {
    console.error("Error in getAdminStatistics controller:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// const getOrderStatusCounts = async (req: Request, res: Response) => {
//   const userId = req.params.userId;
//   try {
//     const statusCounts = await OrderService.getOrderStatusCountsService(userId);

//     res.status(200).json({
//       success: true,
//       message: "Order status counts retrieved successfully",
//       data: statusCounts,
//     });
//   } catch (error) {
//     console.error("Error in getOrderStatusCounts controller:", error);

//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error instanceof Error ? error.message : "Unknown error",
//     });
//   }
// };
const getOrderStatusCountsBySellerController = async (
  req: Request,
  res: Response
) => {
  try {
    // If using auth middleware, you can get sellerId from req.user.id
    const sellerId = req.params.sellerId;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "Seller ID is required",
      });
    }

    const data = await OrderService.getOrderStatusCountsBySellerService(sellerId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in getOrderStatusCountsBySellerController:", error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch seller order status counts",
    });
  }
};

const getOrderStatusSummary = async (req: Request, res: Response) => {
  try {
    const statusSummary = await OrderService.getOrderStatusSummaryService();

    res.status(200).json({
      success: true,
      message: "Order status summary retrieved successfully",
      data: statusSummary,
    });
  } catch (error: any) {
    console.error("Error in getOrderStatusSummary controller:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const getActivityList = async (req: Request, res: Response) => {
  try {
    const activities = await OrderService.getActivityListService();

    res.status(200).json({
      success: true,
      message: "Activity list retrieved successfully",
      data: activities,
    });
  } catch (error: any) {
    console.error("Error in getActivityList controller:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const getUserStatistics = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const statistics = await OrderService.getUserStatisticsService(userId);

    res.status(200).json({
      success: true,
      message: "Seller statistics fetched successfully",
      data: statistics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch Seller statistics",
    });
  }
};

const getProductListWithStatusBySellerId = async (
  req: Request,
  res: Response
) => {
  try {
    const { sellerId } = req.params;
    const { status, page, limit, search } = req.query;

    const result = await OrderService.getProductListWithStatusBySellerIdService(
      sellerId,
      {
        status: status as string,
        page: Number(page),
        limit: Number(limit),
        search: search as string
      }
    );

    if (!result.orders.length) {
      return res
        .status(404)
        .json({ success: false, message: "No orders found" });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get recent orders for seller with pagination
// const getRecentOrdersForSellerController = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { userId } = req.params;
//     const { page, limit } = req.query;

//     if (!userId) {
//       res.status(400).json({
//         success: false,
//         message: "User ID is required in params"
//       });
//       return;
//     }

//     const result = await OrderService.getRecentOrdersForSellerService(userId);

//     res.status(200).json(result);

//   } catch (error: any) {
//     console.error("Error fetching seller orders:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };
const getRecentOrdersForSellerController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page, limit } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const pageNumber = page ? parseInt(page as string) : 1;
    const limitNumber = limit ? parseInt(limit as string) : 10;

    const result = await OrderService.getRecentOrdersForSellerService(userId, pageNumber, limitNumber);

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination
    });

  } catch (error: any) {
    console.error("Error fetching seller orders:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders"
    });
  }
};

const getSellerStatisticsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      res.status(400).json({
        success: false,
        message: "Seller ID is required",
      });
      return;
    }

    const statistics = await OrderService.getSellerStatisticsService(sellerId);

    res.status(200).json({
      success: true,
      message: "Seller statistics fetched successfully",
      data: statistics,
    });
  } catch (error) {
    console.error("Error in getSellerStatisticsController:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch seller statistics",
    });
  }
};

const getSellerOrderStatisticsController = async (
  req: Request,
  res: Response
) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "Seller ID is required",
      });
    }

    const statistics = await OrderService.getSellerOrderStatisticsService(sellerId);

    return res.status(200).json({
      success: true,
      message: "Seller order statistics fetched successfully",
      data: statistics,
    });
  } catch (error: any) {
    console.error("Error in getSellerOrderStatisticsController:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch seller order statistics",
    });
  }
};

export const OrderController = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  getCurrentOrders,
  getPreviousOrders,
  getUserOrderStatistics,
  getAdminStatistics,
  getOrderStatusCountsBySellerController,
  getOrderStatusSummary,
  getActivityList,
  getUserStatistics,
  getProductListWithStatusBySellerId,
  getRecentOrdersForSellerController,
  getSellerStatisticsController,
  getSellerOrderStatisticsController,
};
