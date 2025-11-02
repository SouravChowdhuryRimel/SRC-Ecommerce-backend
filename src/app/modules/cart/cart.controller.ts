import { Request, Response } from "express";
import { CartService } from "./cart.service";

// Create Cart Controller
const createCart = async (req: Request, res: Response) => {
  try {
    const { userId, items } = req.body;

    // Call service to create a cart
    const cart = await CartService.createCart(userId, items);

    // Return created cart as response
    return res.status(201).json(cart);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create cart" });
  }
};

const getSingleCart = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params; // Extract userId from route parameters

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Call service to get the cart by userId
    const cart = await CartService.getSingleCart(userId);

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Return the cart data as response
    return res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch cart data" });
  }
};

export const CartController = {
  createCart,
  getSingleCart,
};
