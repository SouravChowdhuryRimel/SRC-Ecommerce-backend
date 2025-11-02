import { Types } from "mongoose";

export interface IPromotion {
  sellerId: string; // Seller's user ID
  promotionImage: string; // Image URL or path
  promotionName: string;
  promotionType: "percentage" | "fixed";
  discountValue: number;
  minimumPurchase: number;

  applicableType: "allProducts" | "specificProducts" | "productCategories";

  allProducts?: string[];          // For "allProducts" mode
  specificProducts?: string[];     // For "specificProducts" mode
  productCategories?: string[];    // For "productCategories" mode

  startDate: Date;
  endDate: Date;
  termsAndConditions?: string;
  isActive?: boolean;

  totalView?: number;
  totalClick?: number;
  redemptionRate?: string;
  conversionRate?: string;
}
