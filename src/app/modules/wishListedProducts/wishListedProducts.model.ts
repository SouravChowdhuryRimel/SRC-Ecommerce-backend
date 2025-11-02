// models/Wishlist.ts
import { Schema, model, Document } from "mongoose";
import { isWishlistedProducts } from "./wishListedProducts.interface";


const wishlistSchema = new Schema<isWishlistedProducts>(
  {
    userId: {
      type: String,
      required: true,
    },
    withlistProducts: [
        { type: String, ref: "Product" }
    ],
  },
  { timestamps: true }
);

export const Wishlist = model<isWishlistedProducts>("Wishlist", wishlistSchema);
