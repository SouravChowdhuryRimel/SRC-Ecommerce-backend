import { IPromotion } from "./promotion.interface";
import { PromotionModel } from "./promotion.model";
import { Product } from "../products/products.model";
import mongoose from "mongoose";
import { Order } from "../order/order.model";
import { User_Model } from "../user/user.schema";
import { sendNotification } from "../../utils/notificationHelper";

// ✅ CREATE PROMOTION SERVICE
export const createPromotionService = async (payload: IPromotion) => {
  console.log("Initial Payload:", payload);

  let applicableProducts: any[] = [];

  // 🔹 Case 1: Apply to all products
  if (payload.applicableType === "allProducts") {
    const all = await Product.find({ userId: payload.sellerId }, "_id");
    applicableProducts = all.map((p) => p._id);
    payload.allProducts = applicableProducts;
    payload.specificProducts = []; // ✅ clear others
    payload.productCategories = [];
  }

  // 🔹 Case 2: Apply to specific products
  // 🔹 Case 2: Apply to specific products
  else if (
    payload.applicableType === "specificProducts" &&
    payload.specificProducts?.length
  ) {
    payload.allProducts = payload.specificProducts; // ✅ unify
    payload.productCategories = [];
  }

  // 🔹 Case 3: Apply to product categories
  else if (
    payload.applicableType === "productCategories" &&
    payload.productCategories?.length
  ) {
    const categoryProducts = await Product.find(
      {
        category: { $in: payload.productCategories },
        userId: payload.sellerId,
      },
      "_id"
    );
    applicableProducts = categoryProducts.map((p) => p._id);
    payload.allProducts = applicableProducts;
    payload.specificProducts = []; // ✅ clear others
  }

  // ✅ Create promotion
  const promotion = await PromotionModel.create(payload);
  // ✅ Apply discount to all applicable products
  if (promotion.allProducts?.length) {
    const { promotionType, discountValue } = promotion;

    const products = await Product.find({
      _id: { $in: promotion.allProducts },
    });

    for (const product of products) {
      let newPrice = product.price;

      if (promotionType === "percentage") {
        newPrice = product.price - (product.price * discountValue) / 100;
      } else if (promotionType === "fixed") {
        newPrice = Math.max(product.price - discountValue, 0);
      }

      await Product.findByIdAndUpdate(product._id, {
        $set: {
          newPrice, // ✅ discounted price
          discountType: promotionType,
          discountValue: discountValue,
          isNewArrival: false, // optional: disable new arrival flag
        },
      });
    }

    const customers = await User_Model.find({ role: "Buyer" });
    for (const buyer of customers) {
      for (const product of products) {
        await sendNotification(
          buyer._id.toString(),
          " New Promotion Available",
          `${product.name} is now available!`
        );
      }
    }
  }

  return promotion;
};

// ✅ GET SINGLE PROMOTION
export const getPromotionService = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Invalid Promotion ID");

  const promotion = await PromotionModel.findById(id)
    .populate(
      "allProducts specificProducts",
      "name price newPrice discountType discountValue category productImages  reviews  averageRating"
    )
    .exec();

  if (!promotion) throw new Error("Promotion not found");
  return promotion;
};

// ✅ GET ALL PROMOTIONS
export const getAllPromotionsService = async () => {
  return await PromotionModel.find()
    .sort({ createdAt: -1 })
    .populate(
      "allProducts specificProducts",
      "name price newPrice discountType discountValue category productImages  reviews  averageRating"
    )
    .exec();
};

// ✅ UPDATE PROMOTION
export const updatePromotionService = async (
  id: string,
  payload: Partial<IPromotion>
) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new Error("Invalid Promotion ID");

  const promotion = await PromotionModel.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!promotion) throw new Error("Promotion not found");
  return promotion;
};

// ✅ GET SELLER PROMOTIONS
export const getSellerPromotionsService = async (userId: string) => {
  console.log("Fetching promotions for userId:", userId);
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid User ID");
  }
  // In real use, filter promotions by seller’s products
  const res = await PromotionModel.find(
    { isActive: true, sellerId: userId } // Filter by sellerId
  )
    .sort({ endDate: 1 })
    .populate(
      "allProducts specificProducts",
      "name price category productImages  reviews  averageRating"
    );

  console.log("res", res);

  return res;
};

export const incrementView = async (promotionId: string) => {
  const updated = await PromotionModel.findByIdAndUpdate(
    promotionId,
    { $inc: { totalView: 1 } },
    { new: true }
  );
  return updated;
};

//get single promotion analytis
export const getPromotionAnalyticsService = async (promotionId: string) => {
  const promotion = await PromotionModel.findById(promotionId);

  // console.log('promotion', promotion)
  if (!promotion) throw new Error("Promotion not found");

  // ✅ Determine which products are included
  let productIds: any[] = [];

  if (promotion.applicableType === "allProducts") {
    productIds = promotion.allProducts || [];
  } else if (promotion.applicableType === "specificProducts") {
    productIds = promotion.specificProducts || [];
  } else if (promotion.applicableType === "productCategories") {
    const products = await Product.find({
      category: { $in: promotion.productCategories },
    }).select("_id");
    productIds = products.map((p) => p._id);
  }

  const topPerformingProduct = await Product.find({
    _id: { $in: productIds },
  }).sort({ salesCount: -1 });

  console.log("procuts0", topPerformingProduct);

  // ✅ Aggregate orders for those products
  const orderStats = await Order.aggregate([
    { $unwind: "$items" },
    { $match: { "items.productId": { $in: productIds } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
        totalQuantity: { $sum: "$items.quantity" },
      },
    },
  ]);

  console.log("order start", orderStats);

  const totalRevenue = orderStats[0]?.totalRevenue || 0;
  const totalOrders = orderStats[0]?.totalOrders || 0;

  // console.log(totalOrders, "total order");

  // ✅ Derived analytics
  const totalViews = promotion.totalView || 0;

  const redemptionRate =
    totalViews > 0 ? ((totalOrders / totalViews) * 100).toFixed(2) : "0";

  // ✅ Monthly analytics
  const monthlyStats = await Order.aggregate([
    { $unwind: "$items" },
    { $match: { "items.productId": { $in: productIds } } },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalRevenue: { $sum: "$totalAmount" },
        totalSales: { $sum: "$items.quantity" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // console.log("monthly", monthlyStats);

  return {
    promotionName: promotion?.promotionName,
    totalViews,
    salesGenerated: totalRevenue,
    redemptionRate: `${redemptionRate}%`,
    monthlyStats,
    topPerformingProduct: topPerformingProduct,
  };
};

export const getSingleSellerPromotionAnalyticsService = async (
  sellerId: string
) => {
  // Find all promotions for the seller
  const promotions = await PromotionModel.find({ sellerId });

  if (!promotions || promotions.length === 0) {
    throw new Error("Promotion not found");
  }

  // Collect all product IDs from all promotions
  let productIds: any[] = [];

  for (const promotion of promotions) {
    if (promotion.applicableType === "allProducts") {
      productIds.push(...(promotion.allProducts || []));
    } else if (promotion.applicableType === "specificProducts") {
      productIds.push(...(promotion.specificProducts || []));
    } else if (promotion.applicableType === "productCategories") {
      const products = await Product.find({
        category: { $in: promotion.productCategories },
      }).select("_id");
      productIds.push(...products.map((p) => p._id));
    }
  }

  // Remove duplicate product IDs
  productIds = [...new Set(productIds)];

  console.log("product id", productIds);

  // Monthly analytics
  const monthlyStats = await Order.aggregate([
    { $unwind: "$items" },
    { $match: { "items.productId": { $in: productIds } } },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalRevenue: { $sum: "$totalAmount" },
        totalSales: { $sum: "$items.quantity" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return {
    monthlyStats,
  };
};
