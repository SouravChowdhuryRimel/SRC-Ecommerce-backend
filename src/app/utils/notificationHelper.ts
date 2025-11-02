import { db, messaging } from "../configs/firebaseAdmin";
import { NotificationModel } from "../modules/notifications/notifications.model";
import { User_Model } from "../modules/user/user.schema";

export const sendNotification = async (
  userId: string,
  title: string,
  body: string,
): Promise<void> => {
  try {
    console.log("user is ", userId);

    const user = await User_Model.findById(userId);

    if (!user || !user.fcmToken) {
      console.log(`❌ No FCM token for user ${userId}`);
      return;
    }

    const message = {
      notification: { title, body },
      token: user.fcmToken,
    };

  

    const response = await messaging.send(message);

    console.log("✅ Notification sent:", response);
 
    await NotificationModel.create({
      userId,
      title,
      body,
      userProfile: user.profileImage || "",
      timestamp: new Date(),
    });

  } catch (err) {
    console.error("⚠️ Error sending notification:", err);
  }
};
