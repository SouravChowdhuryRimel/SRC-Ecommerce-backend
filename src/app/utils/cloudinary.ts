import multer from "multer";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import { configs } from "../configs";

// -----------------------------
// 🧹 Delete local file
// -----------------------------
export const deleteFile = async (filePath: string) => {
  try {
    await fs.unlink(filePath);
    console.log(`File deleted successfully: ${filePath}`);
  } catch (err: any) {
    console.error(`Error deleting file: ${err.message}`);
  }
};

export const uploadImgToCloudinary = async (
  name: string,
  filePath: string,
  folder: string
) => {
  cloudinary.config({
    cloud_name: configs.cloudinary.cloud_name,
    api_key: configs.cloudinary.cloud_api_key,
    api_secret: configs.cloudinary.cloud_api_secret,
  });

  try {
    console.log("naemedfdf---", name, filePath);
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      folder,
      public_id: name,
      timeout: 60000,
    });

    console.log("upload result ", uploadResult);

    return uploadResult;
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw new Error("Image upload failed");
  } finally {
    await deleteFile(filePath); // Always clean up
  }
};

export const uploadMultipleImages = async (
  filePaths: string[],
  folder: string
) => {
  try {
    const imageUrls: string[] = [];

    for (const filePath of filePaths) {
      const imageName = `${Math.floor(
        100 + Math.random() * 900
      )}-${Date.now()}`;
      const uploadResult = await uploadImgToCloudinary(
        imageName,
        filePath,
        folder
      );
      imageUrls.push(uploadResult.secure_url);
    }

    return imageUrls;
  } catch (error) {
    console.error("Error uploading multiple images:", error);
    throw new Error("Multiple image upload failed");
  }
};

export const deleteImageFromCloudinary = async (publicId: string) => {
  cloudinary.config({
    cloud_name: configs.cloudinary.cloud_name,
    api_key: configs.cloudinary.cloud_api_key,
    api_secret: configs.cloudinary.cloud_api_secret,
  });

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw new Error("Image deletion failed");
  }
};

// -----------------------------
// 🗂️ Multer setup for local uploads
// -----------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "uploads")); // temp folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

export const upload = multer({ storage }); // Single file or fields

// Single image upload (req.file)
export const uploadSingle = upload.single("image");
// Single image for BusinessLogo upload (req.file)
export const uploadSingleforBusinessLogo = upload.single("businessLogo");

// Multiple image upload (req.files)
export const uploadMultiple = upload.array("images", 30);

// Fields-based upload (req.files.photo1, req.files.photo2)
export const MultiUpload = upload.fields([
  { name: "photo1", maxCount: 1 },
  { name: "photo2", maxCount: 1 },
]);
