import mongoose from "mongoose";
import { isWishlistedProducts } from "./wishListedProducts.interface";
import { Wishlist } from "./wishListedProducts.model";

export const createOrUpdateWishlist = async (
  userId: string,
  productId: string
): Promise<isWishlistedProducts> => {
  // Check if the wishlist already exists
  let wishlist = await Wishlist.findOne({ userId });

  if (wishlist) {
    // If product is already in wishlist, remove it (toggle)
    const index = wishlist.withlistProducts.indexOf(productId);
    if (index > -1) {
      wishlist.withlistProducts.splice(index, 1);
    } else {
      wishlist.withlistProducts.push(productId);
    }
    await wishlist.save();
  } else {
    // Create new wishlist document
    wishlist = await Wishlist.create({
      userId,
      withlistProducts: [productId],
    });
  }

  return wishlist;
};

export const getUserWishlist = async (
  userId: string
): Promise<isWishlistedProducts | null> => {
  return Wishlist.findOne({ userId }).populate("withlistProducts");
};



export const removeWishlistProducts = async (
  userId: string,
  productIds: string[]
): Promise<isWishlistedProducts | null> => {
  try {
    // Validate inputs
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid or missing userId");
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new Error("productIds must be a non-empty array");
    }

    // Find wishlist
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      throw new Error("Wishlist not found for this user");
    }

    // Filter out removed products
    const beforeCount = wishlist.withlistProducts.length;

    wishlist.withlistProducts = wishlist.withlistProducts.filter(
      (id: any) => !productIds.includes(id.toString())
    );

    const afterCount = wishlist.withlistProducts.length;

    // Check if anything was removed
    if (beforeCount === afterCount) {
      throw new Error("No matching products found in wishlist to remove");
    }

    await wishlist.save();

    return wishlist;
  } catch (error: any) {
    console.error("Error in removeWishlistProducts:", error.message);
    throw new Error(error.message || "Failed to remove wishlist products");
  }
};


export const isProductWishlisted = async (
  userId: string,
  productId: string
): Promise<boolean> => {
  if (!userId || !productId) {
    throw new Error("User ID and Product ID are required");
  }

  const wishlist = await Wishlist.findOne({ userId });

  if (!wishlist) return false;

  return wishlist.withlistProducts.includes(productId);
};


export const wishlistService = {
  createOrUpdateWishlist,
  getUserWishlist,
  removeWishlistProducts,
  isProductWishlisted
};
