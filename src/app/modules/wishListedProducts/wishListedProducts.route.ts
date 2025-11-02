import { Router } from "express";
import { checkProductWishlistStatus, createOrUpdateWishlist, getUserWishlist, removeWishlistItems } from "./wishListedProducts.controller";

const router = Router();

// Create Promotion
router.post("/add", createOrUpdateWishlist);

// Get all promotion
router.get("/get-single-user/:userId", getUserWishlist);
router.post("/check/isWishlist", checkProductWishlistStatus);

router.delete("/remove", removeWishlistItems);

export const withlistProductsRoutes = router;
