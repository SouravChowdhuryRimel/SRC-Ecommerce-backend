import { User_Model } from "../user/user.schema";
import { ICartItem } from "./cart.interface";
import { Cart } from "./cart.model";

export const createCart = async (userId: string, items: ICartItem[]) => {
  console.log(items, "items from service");

  // Step 1: Check if user already has a cart
  let existingCart = await Cart.findOne({ userId });

  // Step 2: If no cart exists, create a new one
  if (!existingCart) {
    const newCart = new Cart({
      userId,
      items,
    });
    await newCart.save();
    return {
      success: true,
      message: "Cart created successfully.",
      cart: newCart,
    };
  }

  // Step 3: Check for duplicate items (based on productId)
  const existingProductIds = existingCart.items.map((item) =>
    item.productId.toString()
  );

  const duplicateItem = items.find((newItem) =>
    existingProductIds.includes(newItem.productId.toString())
  );

  if (duplicateItem) {
    return {
      success: false,
      message: "This item already exists in cart.",
      productId: duplicateItem.productId,
    };
  }

  // Step 4: Add new items and save
  existingCart.items.push(...items);
  await existingCart.save();

  return {
    success: true,
    message: "Item added to cart successfully.",
    cart: existingCart,
  };
};

export const getSingleCart = async (userId: string) => {
  try {
    // Fetch user’s cart
    const cart = await Cart.find({ userId })
      .populate({
        path: "userId",
        select: "name email",
      })
      .populate({
        path: "items.productId",
        select: "name price quantity userId",
        populate: {
          path: "userId",
          select: "name email",
        },
      });

    if (!cart || cart.length === 0) {
      throw new Error("Cart not found");
    }

    // Flatten all cart items
    const allItems = cart.flatMap((c) => c.items);

    // Group by sellerId (from product.userId)
    const groupedBySeller: Record<string, any> = {};

    console.log("group by seller ", groupedBySeller);

    for (const item of allItems) {
      const product: any = item.productId;
      const seller = product?.userId;
      const id = seller._id?.toString(); // ✅ get plain string

      const sellerData = await User_Model.findOne({ _id: id });

      console.log("seller data ", sellerData);

      if (!seller) continue;

      const sellerId = seller._id.toString();

      if (!groupedBySeller[sellerId]) {
        groupedBySeller[sellerId] = {
          sellerId,
          sellerName: sellerData?.name,
          shopName: sellerData?.businessInfo?.businessName,
          sellerEmail: sellerData?.email,
          items: [],
        };
      }

      groupedBySeller[sellerId].items.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: item.image,
      });
    }

    // Return clean array
    return Object.values(groupedBySeller);
  } catch (error: any) {
    throw new Error(`Failed to group cart by sellers: ${error.message}`);
  }
};

export const CartService = {
  createCart,
  getSingleCart,
};
