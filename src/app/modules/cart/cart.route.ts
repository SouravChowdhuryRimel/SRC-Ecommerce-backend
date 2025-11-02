import { Router } from "express";
import { CartController } from "./cart.controller";

const router = Router();

// Create Cart Route
router.post("/create", CartController.createCart);
router.get("/get-single/:userId", CartController.getSingleCart);

export const CartRoute = router;
