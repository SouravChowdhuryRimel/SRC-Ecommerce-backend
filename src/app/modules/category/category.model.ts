import { Schema, model, Document } from "mongoose";
import { TCategory } from "./category.interface";

export interface ICategory extends TCategory, Document {}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

export const Category = model<ICategory>("Category", categorySchema);
