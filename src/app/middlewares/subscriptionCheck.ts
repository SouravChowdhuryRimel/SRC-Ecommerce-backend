import { User_Model } from "../modules/user/user.schema";

// middleware/subscriptionCheck.ts
export const checkUserSubscription = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id || req.body.userId;
    
    if (!userId) {
      return next();
    }

    const user = await User_Model.findById(userId);
    if (!user) {
      return next();
    }

    // Check if subscription has expired in real-time
    if (user.isSubscriptionActive && user.subscriptionExpiryDate && new Date() > user.subscriptionExpiryDate) {
      // Auto-reset immediately if expired
      await User_Model.findByIdAndUpdate(userId, {
        productAddedPowerQuantity: 0,
        isSubscriptionActive: false,
        isPaidPlan: false,
        subscribtionPlan: null,
        subscriptionResetAt: new Date()
      });
      
      console.log(`🟡 Real-time reset for user ${userId}`);
    }

    next();
  } catch (error) {
    console.error("Error in subscription check middleware:", error);
    next();
  }
};