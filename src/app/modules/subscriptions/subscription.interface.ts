export interface ISubscription {
  title: string;
  priceMonthly: number;
  priceYearly: number;
  productAddedPowerQuantity?: number | "unlimited";
  featuresMonthly: string[];
  featuresYearly: string[];
}
