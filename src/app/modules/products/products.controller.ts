import { Request, Response } from "express";

import {
  CreateProductSchema,
  UpdateProductSchema,
} from "./products.validation";
import { productService } from "./products.service";

const createProduct = async (req: Request, res: Response) => {
  try {
    console.log("Uploaded file(s):", req.file || req.files);
    console.log("hit thit hist eindex");

    const singleFile = req.file as Express.Multer.File;
    const multipleFiles = req.files as Express.Multer.File[];

    const product = await productService.createProductService(
      req.body,
      singleFile || multipleFiles // Pass whichever exists
    );

    res.status(201).json({ success: true, data: product });
  } catch (error: any) {
    console.error("Error creating product:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const updateData = {
      ...req.body,
      ...(files?.productImages && { productImagesFiles: files.productImages }),
      ...(files?.mainImage?.[0] && { mainImageFile: files.mainImage[0] }),
    };

    const product = await productService.updateProductService(id, updateData);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get query parameters with default values
    const page = parseInt(req.query.page as string);
    const limit = parseInt(req.query.limit as string);
    const search = (req.query.search as string) || "";

    // Validate pagination parameters
    if (page < 1) {
      res.status(400).json({
        success: false,
        message: "Page must be a positive number",
      });
      return;
    }

    if (limit < 1 || limit > 100) {
      res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 100",
      });
      return;
    }

    const result = await productService.getAllProductsService(
      page,
      limit,
      search
    );

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSingleProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await productService.getSingleProductService(id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getSingleUserProduct = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string);
    const limit = parseInt(req.query.limit as string);
    const search = (req.query.search as string) || "";

    const result = await productService.getSingleUserProductService(
      userId,
      page,
      limit,
      search
    );

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getProductByCategoryService = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { sort, search, page, limit } = req.query;

    const result = await productService.getProductByCategoryService(category, {
      sort: sort as string,
      search: search as string,
      page: Number(page),
      limit: Number(limit),
    });

    if (!result.products.length) {
      return res
        .status(404)
        .json({ success: false, message: "No products found" });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getNewArrivalsProductsService = async (req: Request, res: Response) => {
  try {
    const product = await productService.getNewArrivalsProductsService();

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Products not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getBestSellingProductsService = async (req: Request, res: Response) => {
  try {
    const product = await productService.getBestSellingProductsService();

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Products not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSellerBestSellingProductsController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const { page, limit, sea } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const pageNumber = page ? parseInt(page as string) : null;
    const limitNumber = limit ? parseInt(limit as string) : null;

    const result = await productService.getSellerBestSellingProductsService(
      userId,
      {
        page: pageNumber,
        limit: limitNumber,
      }
    );

    res.status(200).json(result);
  } catch (error: any) {
    console.error("Error fetching seller best selling products:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch best selling products",
    });
  }
};

const getProductStats = async (req: Request, res: Response) => {
  try {
    // Assuming auth middleware sets req.user._id
    const { userId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const stats = await productService.getProductStatsService(userId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

export const addReviewToProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.body.userId; // Assuming userId is sent in the request body

    // Basic validation
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const updatedProduct = await productService.addProductReviewService(
      productId,
      userId,
      { rating, comment }
    );

    res.status(200).json({
      success: true,
      message: "Review added successfully",
      data: updatedProduct,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInventoryStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const inventoryStatus = await productService.getInventoryStatusService(
      userId
    );

    res.status(200).json({
      success: true,
      data: inventoryStatus,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get inventory status for a specific product
const handleGetInventoryStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { productId } = req.params;

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }

    const inventoryStatus =
      await productService.getInventoryStatusForSingleProduct(productId);

    res.status(200).json({
      success: true,
      data: inventoryStatus,
    });
  } catch (error: any) {
    if (error.message === "Product not found") {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to get inventory status",
      });
    }
  }
};

// Update product quantity
const handleUpdateQuantity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }
    const result = await productService.updateProductQuantity(
      productId,
      quantity
    );

    res.status(200).json({
      success: true,
      message: "Quantity updated successfully",
      data: result,
    });
  } catch (error: any) {
    if (error.message === "Product not found") {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
    } else if (error.message.includes("Quantity cannot be negative")) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to update quantity",
      });
    }
  }
};

// Get single product statistics
const handleGetSingleProductStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { productId } = req.params;
    const { startDate, endDate } = req.query;

    if (!productId) {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }
    const stats = await productService.getSingleProductStats(productId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    if (error.message === "Product not found") {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to get product statistics",
      });
    }
  }
};

const getSalesTrendsController = async (req: Request, res: Response) => {
  const sellerId = req.params.sellerId;
  try {
    const salesData = await productService.getSalesTrends(sellerId);
    res.json(salesData); // Send the aggregated data as the response
  } catch (error: any) {
    res
      .status(500)
      .json({ error: error.message || "Error fetching sales data" });
  }
};

export const productController = {
  createProduct,
  updateProduct,
  getAllProducts,
  getSingleProduct,
  getSingleUserProduct,
  getProductByCategoryService,
  getNewArrivalsProductsService,
  getBestSellingProductsService,

  getSellerBestSellingProductsController,

  getProductStats,
  addReviewToProduct,
  getInventoryStatus,
  handleGetInventoryStatus,
  handleUpdateQuantity,
  handleGetSingleProductStats,
  getSalesTrendsController,
};
