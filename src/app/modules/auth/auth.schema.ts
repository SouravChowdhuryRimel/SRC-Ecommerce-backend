import mongoose, { Schema, Document } from "mongoose";

export interface IPasswordReset extends Document {
  email: string;
  code: string;
  expiresAt: Date;
}

const passwordResetSchema = new Schema<IPasswordReset>({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

export const passwordResetModel =  mongoose.model<IPasswordReset>(
  "PasswordReset",
  passwordResetSchema
);
