import express from "express";
import { productController } from "./products.controller";
import { upload, uploadMultiple, uploadSingle } from "../../utils/cloudinary";
import auth from "../../middlewares/auth";
import { checkUserSubscription } from "../../middlewares/subscriptionCheck";

const router = express.Router();

router.post(
  "/create",
  upload.any(),
  checkUserSubscription,
  productController.createProduct
); // ✅ Create product
// router.put("/update/:id", productController.updateProduct); // ✅ Update product
router.put(
  "/update/:id",
  upload.fields([
    { name: "productImages", maxCount: 10 },
    { name: "mainImage", maxCount: 1 },
  ]),
  productController.updateProduct
);

// ✅ Get all products
router.get("/getSingle/:id", productController.getSingleProduct); // ✅ Get single product
router.get("/getUserProduct/:userId", productController.getSingleUserProduct); // ✅ Get single product
router.get("/getAll", productController.getAllProducts);
router.get(
  "/getSingleCategory/:category",
  productController.getProductByCategoryService
);
router.get("/getNewArrivals", productController.getNewArrivalsProductsService);
router.get("/getBestSelling", productController.getBestSellingProductsService);
router.get(
  "/getSellerBestSelling/:userId",
  productController.getSellerBestSellingProductsController
);

router.put("/addReview/:productId", productController.addReviewToProduct);
router.get("/stats/:userId", productController.getProductStats);

// Inventory status
router.get("/inventory-status/:userId", productController.getInventoryStatus);

// Single product inventory status route
router.get("/inventory/:productId", productController.handleGetInventoryStatus);
router.patch(
  "/updateQuantity/:productId",
  productController.handleUpdateQuantity
);

// Single product statistics route
router.get(
  "/product-stats/:productId",
  productController.handleGetSingleProductStats
);

router.get(
  "/sales-trends/:sellerId",
  productController.getSalesTrendsController
);

export const productRoutes = router;
