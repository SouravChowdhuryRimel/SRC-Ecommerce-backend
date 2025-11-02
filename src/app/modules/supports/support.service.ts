import { Support } from "./support.model";
import { ISupport, ISupportReply } from "./support.interface";
import { sendSupportReplyEmail } from "../../utils/mail_sender";
import { User_Model } from "../user/user.schema";
import { Types } from "mongoose";
import { sendNotification } from "../../utils/notificationHelper";

const createSupport = async (supportData: ISupport): Promise<ISupport> => {
  try {
    // Check if userId exists in User model
    const userExists = await User_Model.findById(supportData.userId);

    if (!userExists) {
      throw new Error("User not found");
    }
    const support = new Support({
      userId: new Types.ObjectId(supportData.userId),
      supportSubject: supportData.supportSubject,
      supportMessage: supportData.supportMessage,
    });

    return await support.save();
  } catch (error: any) {
    if (error.code === 11000) {
      return createSupport(supportData);
    }
    throw new Error(`Failed to create support ticket: ${error.message}`);
  }
};

const getSupportById = async (supportId: string): Promise<ISupport | null> => {
  try {
    if (!Types.ObjectId.isValid(supportId)) {
      throw new Error("Invalid support ID");
    }

    return await Support.findById(supportId).populate("userId", "name email");
  } catch (error: any) {
    throw new Error(`Failed to fetch support ticket: ${error.message}`);
  }
};

const getUserSupports = async (userId: string): Promise<ISupport[]> => {
  try {
    return await Support.find({ userId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
  } catch (error: any) {
    throw new Error(`Failed to fetch user support tickets: ${error.message}`);
  }
};

const getAllSupports = async (): Promise<ISupport[]> => {
  try {
    return await Support.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
  } catch (error: any) {
    throw new Error(`Failed to fetch all support tickets: ${error.message}`);
  }
};

// Get support statistics
const getSupportStats = async (): Promise<{
  pending: number;
  todayNewReports: number;
  resolvedTickets: number;
}> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateFilter = {
      createdAt: { $gte: today, $lt: tomorrow },
    };

    const [pending, resolved, todayTotal] = await Promise.all([
      Support.countDocuments({ status: "Pending" }),
      Support.countDocuments({ status: "Resolved" }),
      Support.countDocuments(dateFilter),
    ]);

    return {
      pending: pending,
      todayNewReports: todayTotal, // Total tickets created today
      resolvedTickets: resolved,
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch support statistics: ${error.message}`);
  }
};

// Create reply to support ticket
const createReply = async (
  supportId: string,
  replyData: { userId: string; message: string }
): Promise<ISupport | null> => {
  try {
    const userExists = await User_Model.findById(replyData.userId);

    if (!userExists) {
      throw new Error("User not found");
    }

    if (!Types.ObjectId.isValid(supportId)) {
      throw new Error("Invalid support ID");
    }

    if (!replyData.userId || !replyData.message) {
      throw new Error("User ID and message are required");
    }

    if (replyData.message.trim().length === 0) {
      throw new Error("Message cannot be empty");
    }

    // Create the reply object
    const newReply: ISupportReply = {
      userId: new Types.ObjectId(replyData.userId),
      message: replyData.message.trim(),
    };

    // Add reply to the support ticket
    const updatedSupport = await Support.findByIdAndUpdate(
      supportId,
      {
        $push: { replies: newReply },
        $set: { status: "Pending" }, // Set back to Pending when there's a new reply
      },
      { new: true }
    )
      .populate("userId", "name email")
      .populate("replies.userId", "name email role");

    if (!updatedSupport) {
      throw new Error("Support ticket not found");
    }

    // Check if ticketId exists and provide a fallback
    const ticketId = updatedSupport.ticketId || "Unknown Ticket ID";

    // Get the user who created the reply
    const replyUser = await User_Model.findById(replyData.userId).select(
      "name email role"
    );

    // Send email notification to the original ticket creator
    if (updatedSupport.userId && replyUser) {
      const ticketUser = updatedSupport.userId as any;

      await sendSupportReplyEmail(
        ticketUser.email,
        ticketUser.name,
        ticketId, // Use the checked ticketId
        updatedSupport.supportSubject,
        replyData.message,
        replyUser.role === "Admin" ? "Support Team" : replyUser.name
      );

      const customers = await User_Model.find({ _id: replyUser._id });
      for (const buyer of customers) {
        await sendNotification(
          buyer._id.toString(),
          "Admin reply your question in your mail , please check!",
          ``
        );
      }
    }

    return updatedSupport;
  } catch (error: any) {
    throw new Error(`Failed to create reply: ${error.message}`);
  }
};

export const SupportService = {
  createSupport,
  getSupportById,
  getUserSupports,
  getAllSupports,
  getSupportStats,
  createReply,
};
