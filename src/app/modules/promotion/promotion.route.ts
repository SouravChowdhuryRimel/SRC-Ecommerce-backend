import { Router } from "express";
import {
  createPromotion,
  getPromotion,
  getAllPromotions,
  updatePromotion,
  pausePromotion,
  getSellerPromotions,
  getPromotionAnalytics,
  incrementViewControllser,
  getPromotgetSingleSellerPromotionAnalyticsController,
} from "./promotion.controller";
import { promotionUpload } from "./promotion.multer";

const router = Router();

// Create Promotion
router.post(
  "/create",
  promotionUpload.single("promotionImage"),
  createPromotion
);

// Get all promotion
router.get("/getAll", getAllPromotions);

// Get single promotion
router.get("/single/:id", getPromotion);

// ✅ Update promotion by ID (optional image upload)
router.put(
  "/update/:id",
  promotionUpload.single("promotionImage"),
  updatePromotion
);

// Pause a promotion by ID
router.patch("/pause/:id", pausePromotion);

// Get seller-specific promotions
router.get("/singl_user_promotioin/:userId", getSellerPromotions);

router.patch("/view/:id", incrementViewControllser);

router.get("/analytics/:id", getPromotionAnalytics);
router.get("/Single-seller-analytics/:id", getPromotgetSingleSellerPromotionAnalyticsController);

export const PromotionRoute = router;
