import { Router } from "express";
import { CategoryController } from "./category.controller";
import { uploadSingle } from "../../utils/cloudinary";
const router = Router();

router.post("/create",uploadSingle, CategoryController.create);
router.get("/getAll", CategoryController.getAll);
router.get("/getSingle/:id", CategoryController.getById);
router.put("/update/:id",uploadSingle, CategoryController.update);
router.delete("/delete/:id", CategoryController.delete);

export const categoryRoute = router;













