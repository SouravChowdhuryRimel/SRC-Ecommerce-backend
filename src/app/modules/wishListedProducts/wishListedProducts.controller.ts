// controllers/wishlist.controller.ts
import { Request, Response } from "express";
import { wishlistService } from "./wishListedProducts.service";


export const createOrUpdateWishlist = async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: "userId and productId are required." });
    }

    const wishlist = await wishlistService.createOrUpdateWishlist(userId, productId);
    res.status(200).json({
      success: true,
      message: "Wishlist updated successfully.",
      data: wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update wishlist.",
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const getUserWishlist = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const wishlist = await wishlistService.getUserWishlist(userId);

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found for this user." });
    }

    res.status(200).json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist.",
      error: error instanceof Error ? error.message : error,
    });
  }
};


export const removeWishlistItems = async (req: Request, res: Response) => {
  try {
    const { userId, productIds } = req.body;

    if (!Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: "productIds must be an array",
      });
    }

    const wishlist = await wishlistService.removeWishlistProducts(userId, productIds);

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found for this user",
      });
    }

    res.status(200).json({
      success: true,
      message: "Selected products removed from wishlist",
      data: wishlist,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};



export const checkProductWishlistStatus = async (req: Request, res: Response) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ success: false, message: "User ID and Product ID are required" });
    }

    const isWishlisted = await wishlistService.isProductWishlisted(userId, productId);

    res.status(200).json({
      success: true,
      data: { isWishlisted },
    });
  } catch (error: any) {
    console.error("Error checking wishlist:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to check wishlist status",
      error: error.message,
    });
  }
};