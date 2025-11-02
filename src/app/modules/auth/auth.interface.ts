export type TAccount = {
  email: string;
  password: string;
  role: "Buyer" | "Seller" | "Admin";
  deviceToken: string;
};

export interface TRegisterPayload extends TAccount {
  name: string;
}

export type TLoginPayload = {
  email: string;
  password: string;
  role: "Buyer" | "Seller" | "Admin";
  deviceToken: string;
};

export type TJwtUser = {
  email: string;
  role?: "Buyer" | "Seller" | "Admin";
};

export interface IChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface IResetPasswordRequest {
  token: string;
  password: string;
}
