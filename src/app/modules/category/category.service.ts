import { deleteFile, uploadImgToCloudinary } from "../../utils/cloudinary";
import { sendNotification } from "../../utils/notificationHelper";
import { User_Model } from "../user/user.schema";
import { TCategory } from "./category.interface";
import { Category } from "./category.model";

export const CategoryService = {
  async createCategory(payload: any, filePath?: string) {
    try {
      let imageUrl = payload.image || "";

      console.log("paylaod", payload, filePath);

      // If image file exists, upload to Cloudinary
      if (filePath) {
        // Generate a unique name for the image
        const imageName = `category-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`;

        console.log("ima", imageName, filePath);

        const uploadResult = await uploadImgToCloudinary(
          imageName, // Use generated name instead of category name
          filePath,
          "categories"
        );
        imageUrl = uploadResult.secure_url;
      }

      // Validate that we have an image URL
      if (!imageUrl) {
        throw new Error("Category image is required");
      }

      const isExitsCategory = await Category.findOne({ name: payload.name });

      if (isExitsCategory) {
        throw new Error("The category is already exits ");
      }

      const category = new Category({
        name: payload.name,
        image: imageUrl,
      });

      const res = await category.save();
      console.log("res category", res);

      if (res) {
        const customers = await User_Model.find();
        for (const buyer of customers) {
          await sendNotification(
            buyer._id.toString(),
            "🛒 New Category Added!",
            `${res.name} category is now available!`
          );
        }
      }

      return res;
    } catch (error: any) {
      console.error("Error in createCategory:", error);

      // Clean up file if upload failed
      if (filePath) {
        await deleteFile(filePath).catch((cleanupError) =>
          console.error("File cleanup error:", cleanupError)
        );
      }

      throw new Error(error.message || "Failed to create category");
    }
  },

  // Get all categories
  async getAllCategories() {
    return await Category.find().sort({ createdAt: -1 });
  },

  // Get single category by ID
  async getCategoryById(id: string) {
    return await Category.findById(id);
  },

  // Update category
  async updateCategory(id: string, name: string, filePath: any) {
    const categoryName = typeof name === "string" ? name : name;
    console.log("name________:", categoryName);

    let imageUrl = "";

    console.log("update service paylaod", name, filePath);

    // If image file exists, upload to Cloudinary
    if (filePath) {
      // Generate a unique name for the image
      const imageName = `category-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;

      // console.log("ima", imageName, filePath);

      const uploadResult = await uploadImgToCloudinary(
        imageName, // Use generated name instead of category name
        filePath,
        "categories"
      );
      imageUrl = uploadResult.secure_url;
    }

    // Validate that we have an image URL
    if (!imageUrl) {
      throw new Error("Category image is required");
    }

    console.log("name fdgfd ttttt ", categoryName);
    return await Category.findByIdAndUpdate(
      id,
      { name: categoryName, image: imageUrl },
      { new: true }
    );
  },

  // Delete category
  async deleteCategory(id: string) {
    return await Category.findByIdAndDelete(id);
  },
};
