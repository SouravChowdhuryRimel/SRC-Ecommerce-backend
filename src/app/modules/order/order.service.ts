import { Order } from "./order.model";
import {
  IOrder,
  IOrderItem,
  IAdminStatistics,
  IOrderStatusSummary,
} from "./order.interface";
import { Types } from "mongoose";
import { cleanRegex } from "zod/v4/core/util.cjs";
import { Product } from "../products/products.model";
import { User_Model } from "../user/user.schema";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { populate } from "dotenv";
import { sendNotification } from "../../utils/notificationHelper";
dayjs.extend(relativeTime);

// Get recent orders for seller by user ID from params
interface FormattedOrderItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IOrderStatusCounts {
  newOrders: number;
  processing: number;
  completed: number;
}

export interface IOrderStatusData {
  counts: IOrderStatusCounts;
  newOrders: any[];
  processingOrders: any[];
  completedOrders: any[];
}

interface FormattedOrder {
  orderNumber: string;
  status: string;
  date: Date;
  items: FormattedOrderItem[];
  totalAmount: number;
  currency: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SellerOrdersResponse {
  success: boolean;
  data: FormattedOrder[];
  pagination: PaginationInfo;
}
interface IUserStatistics {
  totalRevenue: number;
  totalOrders: number;
  conversionRate: number;
  productsSold: number;
  averageOrderValue: number;
}

interface GetOrdersOptions {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}
interface FormattedOrderItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface FormattedOrder {
  orderNumber: string;
  status: string;
  date: Date;
  items: FormattedOrderItem[];
  totalAmount: number;
  currency: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface SellerOrdersResponse {
  success: boolean;
  data: FormattedOrder[];
  pagination: PaginationInfo;
}
// Utility function to calculate subtotal, shipping cost, and total amount
const calculateOrderAmounts = (items: IOrderItem[]) => {
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Calculate shipping cost as 10% of the subtotal
  const shippingCost = subtotal * 0.1; // 10% of subtotal

  // Calculate tax as 5% of the subtotal
  const tax = subtotal * 0.05; // 5% of subtotal

  // Calculate the total amount (subtotal + shipping cost + tax)
  const totalAmount = subtotal + shippingCost + tax;

  return { subtotal, shippingCost, tax, totalAmount };
};

// Create Order
const createOrder = async (orderData: IOrder) => {
  // Calculate order amounts

  const { subtotal, shippingCost, tax, totalAmount } = calculateOrderAmounts(
    orderData.items
  );

  try {
    const order = await Order.create({
      ...orderData,
      subtotal,
      shippingCost,
      tax, // Include the tax in the order
      totalAmount,
    });

    // Notify all customers
    const productIds = order.items.map((item) => item.productId);
    console.log("product ids ", productIds);

    const products = await Product.find({ _id: { $in: productIds } });
    console.log("products---- ", products);

    for (const product of products) {
      const customers = await Product.find({ userId: product.userId });

      console.log("customers ", customers);

      console.log("notifying ", customers);
      await sendNotification(
        customers[0].userId.toString(),
        "🛒 New Order Placed!",
        `An order has been placed for this ${product.name}. Check it out!`
      );
    }

    // const customers = await User_Model.find({ role: "Buyer" });
    // for (const buyer of customers) {
    //   await sendNotification(
    //     buyer._id.toString(),
    //     "🛒 New Order Added!",
    //     ` is now available!`
    //   );
    // }

    // Save and return the created order
    return order;
  } catch (error: any) {
    throw new Error(`Failed to create order: ${error.message}`);
  }
};

const getAllOrders = async (filters: any = {}): Promise<IOrder[]> => {
  try {
    const query: Record<string, any> = {};

    // Apply the filter from controller
    if (filters.status) {
      query.status = filters.status;
    }

    const orders = await Order.find(query)
      .populate({
        path: "userId",
        select: "name email",
      })
      .populate({
        path: "items.productId",
        select: "name price stock image",
      })
      .sort({ createdAt: -1 });

    return orders;
  } catch (error: any) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }
};

// Get a single order by ID
const getOrderById = async (orderId: string): Promise<IOrder | null> => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID");
  }

  try {
    return await Order.findById(orderId)
      .populate("userId", "name email")
      .populate("items.productId", "name price");
  } catch (error: any) {
    throw new Error(`Failed to fetch order: ${error.message}`);
  }
};

// Update an order
const updateOrder = async (
  orderId: string,
  updateData: Partial<IOrder>
): Promise<IOrder | null> => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID");
  }

  try {
    return await Order.findByIdAndUpdate(orderId, updateData, { new: true })
      .populate("userId", "name email")
      .populate("items.productId", "name price");
  } catch (error: any) {
    throw new Error(`Failed to update order: ${error.message}`);
  }
};

// Update Order Status
export const updateOrderStatus = async (
  orderId: string,
  status: string
): Promise<IOrder | null> => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new Error("Invalid order ID");
  }

  try {
    // ✅ Find existing order first (for validation)
    const existingOrder: any = await Order.findById(orderId).populate("userId");

    if (!existingOrder) {
      throw new Error("Order not found");
    }

    // ✅ Validate status transition (example: only cancel if placed)
    if (status === "cancelled" && existingOrder.status !== "placed") {
      throw new Error(
        `Order cannot be cancelled because it is already "${existingOrder.status}".`
      );
    }

    // ✅ Prepare the dynamic update for statusDates
    const statusDateField = `statusDates.${status}`;
    const updateData = {
      status,
      [statusDateField]: new Date(),
    };

    // ✅ Perform the update
    const updatedOrder: any = await Order.findOneAndUpdate(
      { _id: orderId },
      { $set: updateData },
      { new: true } // return the updated document
    ).populate("userId");

    if (!updatedOrder) {
      throw new Error("Failed to update order status");
    }

    // ✅ Send user notification
    await sendNotification(
      updatedOrder.userId._id.toString(),
      "📦 Order Status Updated",
      `Your order #${updatedOrder.orderNumber} status has been updated to "${status}".`
    );

    return updatedOrder;
  } catch (error: any) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }
};

const getCurrentOrdersService = async (userId: string) => {
  console.log("hit hit ---------------");
  const currentStatuses = [
    "placed",
    "payment_processed",
    "shipped",
    "out_for_delivery",
  ];
  const orders = await Order.find({
    userId,
    status: { $in: currentStatuses },
  })
    .sort({ createdAt: -1 })
    .populate("items.productId", "name ");
  console.log("orders ", orders);
  return orders;
};

// 🟣 Get previous (completed/cancelled) orders
const getPreviousOrdersService = async (userId: string) => {
  const previousStatuses = ["delivered", "cancelled", "returned"];
  const orders = await Order.find({
    userId,
    status: { $in: previousStatuses },
  })
    .sort({ createdAt: -1 })
    .populate("items.productId", "name ");
  return orders;
};

// Add this to your existing order.service.ts

const getUserOrderStatistics = async (userId: string) => {
  try {
    const totalOrders = await Order.countDocuments({ userId });

    const pendingOrders = await Order.countDocuments({
      userId,
      status: {
        $in: ["placed", "payment_processed", "shipped", "out_for_delivery"],
      },
    });

    // console.log('pending orders ',pendingOrders)

    const salesResult = await Order.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
        },
      },
    ]);

    // console.log('sales reslult ',salesResult)

    const returnedOrders = await Order.countDocuments({
      userId,
      status: "returned",
    });

    const totalSales = salesResult.length > 0 ? salesResult[0].totalSales : 0;

    return {
      totalOrders,
      pendingOrders,
      totalSales,
      returnedOrders,
    };
  } catch (error: any) {
    throw new Error(`Failed to get order statistics: ${error.message}`);
  }
};

const getAdminStatisticsService = async (): Promise<IAdminStatistics> => {
  try {
    const [revenueResult, totalOrders, totalProducts, activeUsers] =
      await Promise.all([
        // Total Sales (Revenue)
        Order.aggregate([
          {
            $match: {
              status: { $ne: "cancelled" },
            },
          },
          {
            $group: {
              _id: null,
              totalSales: { $sum: "$totalAmount" },
            },
          },
        ]),

        // Total Orders
        Order.countDocuments({ status: { $ne: "cancelled" } }),

        // Total Products
        Product.countDocuments(),

        // Active Users
        User_Model.countDocuments({ isDeleted: false }),
      ]);

    return {
      totalSales: revenueResult[0]?.totalSales || 0,
      totalOrders,
      activeUsers,
      totalProducts,
    };
  } catch (error) {
    console.error("Error in getAdminStatisticsService:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch admin statistics"
    );
  }
};

// const getOrderStatusCountsService = async (
//   userId: string
// ): Promise<IOrderStatusData> => {
//   // Check if user exists and is a seller
//   const existingUser = await User_Model.findById(userId);
//   if (!existingUser) {
//     throw new Error("User not found");
//   }

//   if (existingUser.role !== "Seller") {
//     throw new Error("Only seller can access this data");
//   }

//   try {
//     // Get counts and order lists in parallel
//     const [
//       newOrdersCount,
//       processingCount,
//       completedCount,
//       newOrdersList,
//       processingOrdersList,
//       completedOrdersList,
//     ] = await Promise.all([
//       // Counts
//       Order.countDocuments({
//         userId,
//         status: "placed",
//       }),
//       Order.countDocuments({
//         userId,
//         status: {
//           $in: ["payment_processed", "shipped", "out_for_delivery"],
//         },
//       }),
//       Order.countDocuments({
//         userId,
//         status: "delivered",
//       }),

//       // Order Lists
//       Order.find({
//         userId,
//         status: "placed",
//       })
//         .populate("items.productId", "name price productImages")
//         .sort({ createdAt: -1 }),

//       Order.find({
//         userId,
//         status: {
//           $in: ["payment_processed", "shipped", "out_for_delivery"],
//         },
//       })
//         .populate("items.productId", "name price productImages")
//         .sort({ createdAt: -1 }),

//       Order.find({
//         userId,
//         status: "delivered",
//       })
//         .populate("items.productId", "name price productImages")
//         .sort({ createdAt: -1 }),
//     ]);

//     return {
//       counts: {
//         newOrders: newOrdersCount,
//         processing: processingCount,
//         completed: completedCount,
//       },
//       newOrders: newOrdersList,
//       processingOrders: processingOrdersList,
//       completedOrders: completedOrdersList,
//     };
//   } catch (error) {
//     console.error("Error in getOrderStatusCountsService:", error);
//     throw new Error(
//       error instanceof Error
//         ? error.message
//         : "Failed to fetch order status counts and lists"
//     );
//   }
// };

const getOrderStatusCountsBySellerService = async (
  sellerId: string
): Promise<IOrderStatusData> => {
  // Check if user exists and is a seller
  const existingUser = await User_Model.findById(sellerId);
  if (!existingUser) throw new Error("User not found");
  if (existingUser.role !== "Seller") throw new Error("Only seller can access this data");

  const sellerObjectId = new Types.ObjectId(sellerId);

  try {
    const statuses = {
      newOrders: ["placed"],
      processing: ["payment_processed", "shipped", "out_for_delivery"],
      completed: ["delivered"],
    };

    // Helper function to fetch orders for a given status
    const fetchOrders = async (statusArray: string[]) => {
      return Order.aggregate([
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        { $match: { "product.userId": sellerObjectId, status: { $in: statusArray } } },
        {
          $group: {
            _id: "$_id",
            orderNumber: { $first: "$orderNumber" },
            status: { $first: "$status" },
            contactInfo: { $first: "$contactInfo" },
            createdAt: { $first: "$createdAt" },
            items: { $push: "$items" },
            totalAmount: { $first: "$totalAmount" },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);
    };

    const [newOrdersList, processingOrdersList, completedOrdersList] = await Promise.all([
      fetchOrders(statuses.newOrders),
      fetchOrders(statuses.processing),
      fetchOrders(statuses.completed),
    ]);

    return {
      counts: {
        newOrders: newOrdersList.length,
        processing: processingOrdersList.length,
        completed: completedOrdersList.length,
      },
      newOrders: newOrdersList,
      processingOrders: processingOrdersList,
      completedOrders: completedOrdersList,
    };
  } catch (error) {
    console.error("Error in getOrderStatusCountsBySellerService:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch order status counts and lists"
    );
  }
};
const getOrderStatusSummaryService = async (): Promise<
  IOrderStatusSummary[]
> => {
  try {
    // Get total orders count
    const totalOrders = await Order.countDocuments();

    if (totalOrders === 0) {
      return [];
    }

    // Get count for each status
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Map to the required format and calculate percentages
    const statusSummary = statusCounts.map((statusCount) => {
      const percentage = Math.round((statusCount.count / totalOrders) * 100);

      return {
        status: statusCount._id,
        count: statusCount.count,
        percentage: percentage,
      };
    });

    return statusSummary;
  } catch (error) {
    console.error("Error in getOrderStatusSummaryService:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch order status summary"
    );
  }
};



function capitalizeFirstLetter(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const getActivityListService = async () => {
  // 1️⃣ Fetch Orders
  const orders = await Order.find()
    .populate("userId", "email")
    .sort({ createdAt: -1 })
    .exec();

  const orderActivities = orders.map((order) => {
    // Cast through unknown first
    const user = order.userId as unknown as { email: string } | null;
    const createdAt = order.createdAt ?? new Date();

    return {
      Type: "Order",
      Description: `New order #${order.orderNumber}`,
      User: user ? user.email : order.contactInfo.email,
      Amount: `$${order.totalAmount}`,
      Status: capitalizeFirstLetter(order.status),
      Time: dayjs(order.createdAt).fromNow(),
      timestamp: createdAt.getTime(),
    };
  });

  // 2️⃣ Fetch Users
  const users = await User_Model.find().sort({ createdAt: -1 }).exec();
  const userActivities = users.map((user) => ({
    Type: "User",
    Description: "New user registration",
    User: user.email,
    Amount: "-", // no amount
    Status: "Active",
    Time: dayjs(user.createdAt).fromNow(),
  }));

  const products = await Product.find()
    .populate("userId", "email") // Populate the user who created the product
    .sort({ updatedAt: -1 })
    .exec();

  const productActivities = products.map((product) => {
    // Cast through unknown first to access populated fields
    const createdByUser = product.userId as unknown as { email: string } | null;

    return {
      Type: "Product",
      Description: `Product ${
        product.createdAt === product.updatedAt ? "created" : "updated"
      }: ${product.name}`,
      User: createdByUser ? createdByUser.email : "admin@store.com",
      Amount: "-",
      Status: product.createdAt === product.updatedAt ? "Created" : "Updated",
      Time: dayjs(product.updatedAt).fromNow(),
    };
  });

  // 4️⃣ Combine all and sort by Time (descending)
  const allActivities = [
    ...orderActivities,
    ...userActivities,
    ...productActivities,
  ];

  allActivities.sort((a, b) => {
    // Convert "2 min ago", "5 min ago" etc. to proper sorting
    // This is a simple approach - for better accuracy, consider using timestamps
    // return a.Time.localeCompare(b.Time);
    const getTimeValue = (timeStr: string) => {
      if (timeStr.includes("min")) return parseInt(timeStr);
      if (timeStr.includes("hour")) return parseInt(timeStr) * 60;
      if (timeStr.includes("day")) return parseInt(timeStr) * 1440;
      return 0;
    };

    return getTimeValue(a.Time) - getTimeValue(b.Time);
  });

  return allActivities;
};

const getUserStatisticsService = async (
  userId: string
): Promise<IUserStatistics> => {
  try {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const userObjectId = new Types.ObjectId(userId);

    // Get all orders for the user
    const [orders, allOrders] = await Promise.all([
      Order.find({ userId: userObjectId }),
      Order.find({ userId: userObjectId }).populate("items.productId"),
    ]);

    if (orders.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        conversionRate: 0,
        productsSold: 0,
        averageOrderValue: 0,
      };
    }

    // Calculate total revenue (only from delivered orders)
    const totalRevenue = orders
      .filter((order) => order.status === "delivered")
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Calculate total orders
    const totalOrders = await Order.countDocuments({
      status: { $ne: "cancelled" },
    });

    // Calculate products sold (only from delivered orders)
    const productsSold = allOrders
      .filter((order) => order.status === "delivered")
      .reduce(
        (sum, order) =>
          sum +
          order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0
      );

    // Calculate average order value
    const averageOrderValue =
      totalRevenue /
        orders.filter((order) => order.status === "delivered").length || 0;

    // Calculate conversion rate (delivered orders / total orders)
    const deliveredOrders = orders.filter(
      (order) => order.status === "delivered"
    ).length;
    const conversionRate = (deliveredOrders / totalOrders) * 100;

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders,
      conversionRate: Number(conversionRate.toFixed(2)),
      productsSold,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
    };
  } catch (error: any) {
    throw new Error(`Failed to get user statistics: ${error.message}`);
  }
};


const getProductListWithStatusBySellerIdService = async (
  sellerId: string,
  options: GetOrdersOptions = {}
) => {
  const { status, page = 1, limit = 10 } = options;

  // Filter orders by seller (userId) and status if provided
  const filter: Record<string, any> = { userId: sellerId };
  if (status) {
    if (status === "pending") {
      filter.status = {
        $in: ["placed", "payment_processed", "out_for_delivery", "pending"],
      };
    } else {
      filter.status = status;
    }
  }

  const skip = (page - 1) * limit;

  // Fetch orders with populated products
  const ordersWithProducts = await Order.find(
    status
      ? status === "pending"
        ? { status: { $in: ["placed", "payment_processed", "out_for_delivery", "pending"] } }
        : { status }
      : {}
  )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("items.productId", "name userId")
    .exec();

  // Filter orders where at least one product belongs to the seller
  const filteredOrders = ordersWithProducts.filter((order) =>
    order.items.some(
      (item) =>
        item.productId && (item.productId as any).userId?.toString() === sellerId
    )
  );

  // Count total orders for pagination
  const allOrders = await Order.find(
    status
      ? status === "pending"
        ? { status: { $in: ["placed", "payment_processed", "out_for_delivery", "pending"] } }
        : { status }
      : {}
  ).populate("items.productId", "userId");

  const total = allOrders.filter((order) =>
    order.items.some(
      (item) =>
        item.productId && (item.productId as any).userId?.toString() === sellerId
    )
  ).length;

  return {
    orders: filteredOrders,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

const getRecentOrdersForSellerService = async (
  sellerId: string,
  page: number,
  limit: number
): Promise<{
  orders: IOrder[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> => {
  const currentPage = Math.max(1, page);
  const currentLimit = Math.max(1, limit);
  const skip = (currentPage - 1) * currentLimit;

  // Fetch orders with populated products
  const ordersWithProducts = await Order.find()
    .populate({
      path: "items.productId",
      select: "name userId",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(currentLimit)
    .exec();

  // Filter orders safely (ignore null products)
  const filteredOrders = ordersWithProducts.filter((order) =>
    order.items.some(
      (item) =>
        item.productId && (item.productId as any).userId?.toString() === sellerId
    )
  );


  // Count total orders safely
  const allOrders = await Order.find().populate({
    path: "items.productId",
    select: "userId",
  });

  const totalOrders = allOrders.filter((order) =>
    order.items.some(
      (item) => item.productId && (item.productId as any).userId?.toString() === sellerId
    )
  ).length;

  const totalPages = Math.ceil(totalOrders / currentLimit);

  return {
    orders: filteredOrders,
    pagination: {
      currentPage,
      totalPages,
      totalOrders,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    },
  };
};

const getSellerStatisticsService = async (
  sellerId: string
): Promise<IUserStatistics> => {
  try {
    if (!Types.ObjectId.isValid(sellerId)) {
      throw new Error("Invalid seller ID");
    }

    const sellerObjectId = new Types.ObjectId(sellerId);

    // Fetch all orders with populated products
    const allOrders = await Order.find()
      .populate({
        path: "items.productId",
        select: "name userId price",
      })
      .exec();

    // Filter only orders that contain at least one product by this seller
    const sellerOrders = allOrders.filter((order) =>
      order.items.some(
        (item) =>
          item.productId &&
          (item.productId as any).userId?.toString() === sellerId
      )
    );

    if (sellerOrders.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        conversionRate: 0,
        productsSold: 0,
        averageOrderValue: 0,
      };
    }

    // Consider orders where payment was completed. Some flows mark orders as
    // 'payment_processed' before delivery — include those so revenue shows up
    // for recently paid orders as well as delivered orders.
    const paidStatuses = ["delivered", "payment_processed"];
    const deliveredOrders = sellerOrders.filter((order) => paidStatuses.includes(order.status));

    // Calculate total revenue and products sold from paid/delivered orders.
    let totalRevenue = 0;
    let productsSold = 0;

    for (const order of deliveredOrders) {
      const sellerItems = order.items.filter(
        (item) => item.productId && (item.productId as any).userId?.toString() === sellerId
      );
      for (const item of sellerItems) {
        // Use the price recorded on the order item if available; fall back to product price
        const itemPrice = typeof item.price === 'number' && item.price > 0 ? item.price : ((item.productId as any)?.price || 0);
        totalRevenue += itemPrice * (item.quantity || 0);
        productsSold += item.quantity || 0;
      }
    }

    const averageOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;
    const conversionRate = sellerOrders.length > 0 ? (deliveredOrders.length / sellerOrders.length) * 100 : 0;

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders: sellerOrders.length,
      conversionRate: Number(conversionRate.toFixed(2)),
      productsSold,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
    };
  } catch (error: any) {
    console.error("Error in getSellerStatisticsService:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to fetch seller statistics"
    );
  }
};
const getSellerOrderStatisticsService = async (sellerId: string) => {
  try {
    if (!Types.ObjectId.isValid(sellerId)) {
      throw new Error("Invalid seller ID");
    }

    const sellerObjectId = new Types.ObjectId(sellerId);

    // Fetch all orders that contain at least one product belonging to the seller
    const orders = await Order.find()
      .populate({
        path: "items.productId",
        select: "userId price",
      })
      .exec();

    // Filter orders related to this seller
    const sellerOrders = orders.filter((order) =>
      order.items.some(
        (item) =>
          item.productId &&
          (item.productId as any).userId?.toString() === sellerId
      )
    );

    const totalOrders = sellerOrders.length;

    // Count pending orders
    const pendingOrders = sellerOrders.filter((order) =>
      ["placed", "payment_processed", "shipped", "out_for_delivery"].includes(
        order.status
      )
    ).length;

    // Count returned orders
    const returnedOrders = sellerOrders.filter(
      (order) => order.status === "returned"
    ).length;

    // Calculate total sales (sum of item prices * quantity for delivered orders)
    let totalSales = 0;
    for (const order of sellerOrders) {
      if (order.status === "delivered") {
        for (const item of order.items) {
          const product = item.productId as any;
          if (product?.userId?.toString() === sellerId) {
            totalSales += item.price * item.quantity;
          }
        }
      }
    }

    return {
      totalOrders,
      pendingOrders,
      totalSales: Number(totalSales.toFixed(2)),
      returnedOrders,
    };
  } catch (error: any) {
    throw new Error(`Failed to get seller order statistics: ${error.message}`);
  }
};

export const OrderService = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  getCurrentOrdersService,
  getPreviousOrdersService,
  getUserOrderStatistics,
  getAdminStatisticsService,
  getOrderStatusCountsBySellerService,
  getOrderStatusSummaryService,
  getActivityListService,
  getUserStatisticsService,
  getProductListWithStatusBySellerIdService,
  getRecentOrdersForSellerService,
  getSellerStatisticsService,
  getSellerOrderStatisticsService,
};
