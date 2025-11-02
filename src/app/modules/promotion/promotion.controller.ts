import { Request, Response } from "express";
import {
  CreatePromotionSchema,
  UpdatePromotionSchema,
} from "./promotion.validation";
import {
  createPromotionService,
  getPromotionService,
  getAllPromotionsService,
  updatePromotionService,
  getSellerPromotionsService,
  getPromotionAnalyticsService,
  incrementView,
  getSingleSellerPromotionAnalyticsService,
} from "./promotion.service";
import { v2 as cloudinary } from "cloudinary";
import { configs } from "../../configs";
import { PromotionModel } from "./promotion.model";

cloudinary.config({
  cloud_name: configs.cloudinary.cloud_name,
  api_key: configs.cloudinary.cloud_api_key,
  api_secret: configs.cloudinary.cloud_api_secret,
});

// ✅ CREATE PROMOTION
export const createPromotion = async (req: Request, res: Response) => {
  try {
    const validatedData = CreatePromotionSchema.parse(req.body);

    let imageUrl = "";
    if (req.file?.buffer) {
      const result: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "promotions" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(req.file?.buffer);
      });
      imageUrl = result.secure_url;
    }

    const dataToSave: any = {
      ...validatedData,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
      promotionImage: imageUrl,
    };

    const promotion = await createPromotionService(dataToSave);
    res.status(201).json({ success: true, data: promotion });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ GET SINGLE PROMOTION
export const getPromotion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const promotion = await getPromotionService(id);
    res.status(200).json({ success: true, data: promotion });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

// ✅ GET ALL PROMOTIONS
export const getAllPromotions = async (req: Request, res: Response) => {
  try {
    const promotions = await getAllPromotionsService();
    res.status(200).json({ success: true, data: promotions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ UPDATE PROMOTION
export const updatePromotion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = UpdatePromotionSchema.parse(req.body);

    let imageUrl: string | undefined;
    if (req.file?.buffer) {
      const result: any = await new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          { folder: "promotions" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        upload.end(req.file?.buffer);
      });
      imageUrl = result.secure_url;
    }

    const dataToUpdate: any = {
      ...validatedData,
      ...(validatedData.startDate && {
        startDate: new Date(validatedData.startDate),
      }),
      ...(validatedData.endDate && {
        endDate: new Date(validatedData.endDate),
      }),
      ...(imageUrl && { promotionImage: imageUrl }),
    };

    const updatedPromotion = await updatePromotionService(id, dataToUpdate);
    res.status(200).json({
      success: true,
      message: "Promotion updated successfully",
      data: updatedPromotion,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ✅ PAUSE PROMOTION
export const pausePromotion = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updatedPromotion = await updatePromotionService(id, {
      isActive: false, // optional, if your schema supports this
    });
    res.status(200).json({
      success: true,
      message: "Promotion paused successfully",
      data: updatedPromotion,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};



// ✅ GET PROMOTIONS BY SELLER
export const getSellerPromotions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId)
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });

    const promotions = await getSellerPromotionsService(userId);
    res.status(200).json({ success: true, data: promotions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const incrementViewControllser = async (req: Request, res: Response) => {
  try {
    const promotion = await incrementView(req.params.id);
    if (!promotion) {
      return res.status(404).json({ message: "Promotion not found" });
    }

    res.status(200).json({
      success: true,
      totalView: promotion.totalView,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating view",
      error: (err as Error).message,
    });
  }
};

//get single promotion analytis
export const getPromotionAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const analytics = await getPromotionAnalyticsService(id);
    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// single seller promotion analytis 
export const getPromotgetSingleSellerPromotionAnalyticsController = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const analytics = await getSingleSellerPromotionAnalyticsService(id);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
