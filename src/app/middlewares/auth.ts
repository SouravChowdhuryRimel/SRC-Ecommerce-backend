import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app_error";
import { configs } from "../configs";
import { jwtHelpers, JwtPayloadType } from "../utils/JWT";
import { User_Model } from "../modules/user/user.schema";

type Role = "Admin" | "Seller" | "Buyer";

const auth = (...roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      // console.log("Token", authHeader);

      // ✅ Check if header exists and starts with Bearer
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError("You are not authorize!!", 401);
      }

      // ✅ Extract token from "Bearer <token>"
      const token = authHeader.split(" ")[1];

      // ✅ Verify token using correct secret
      const verifiedUser = jwtHelpers.verifyToken(
        token,
        configs.jwt.accessToken_secret as string
      );



      // console.log("Varify user", verifiedUser)



      // ✅ Check if role is allowed (if roles are specified)
      if (roles.length && !roles.includes(verifiedUser.role)) {
        throw new AppError("You are not authorize!!", 401);
      }

      // ✅ Check if user still exists in DB
      const isUserExist = await User_Model.findOne({
        email: verifiedUser?.email,
      }).lean();

      if (!isUserExist) {
        throw new AppError("Account not found!", 404);
      }

      req.user = verifiedUser as JwtPayloadType;

      // console.log("request user", req.user)
      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;
