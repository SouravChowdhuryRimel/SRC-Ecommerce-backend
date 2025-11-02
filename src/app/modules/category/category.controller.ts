import { Request, Response } from "express";
import { CategoryService } from "./category.service";

export const CategoryController = {
  // Create
  async create(req: Request, res: Response) {
    try {
      const { name } = req.body;
      const file = req.file;
      console.log("file ", file);

      // console.log("Uploaded file:", file);

      // Pass the actual file path to the service
      const filePath = file ? file.path : undefined;

      const category = await CategoryService.createCategory({ name }, filePath);

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: category,
      });
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Get all
  async getAll(req: Request, res: Response) {
    try {
      const categories = await CategoryService.getAllCategories();
      res.status(200).json({
        success: true,
        message: "Category get all successfull",
        data: categories,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get single
  async getById(req: Request, res: Response) {
    try {
      const category = await CategoryService.getCategoryById(req.params.id);
      if (!category)
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      res.status(200).json({
        success: true,
        message: "Single Category get successfull",
        data: category,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Update
  async update(req: Request, res: Response) {
    const data = req?.body;
    const file = req.file;

    // console.log("in controller ", file);

    // console.log("Uploaded file:", file);

    // Pass the actual file path to the service
    const filePath = file ? file.path : undefined;

    try {
      const category = await CategoryService.updateCategory(
        req.params.id,
        data.name,
        filePath
      );
      // if (!category)
      //   return res
      //     .status(404)
      //     .json({ success: false, message: "Category not found" });
      res.status(200).json({
        success: true,
        message: "Category update successfull",
        data: category,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  // Delete
  async delete(req: Request, res: Response) {
    try {
      const deleted = await CategoryService.deleteCategory(req.params.id);
      if (!deleted)
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      res.status(200).json({ success: true, message: "Category deleted" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
