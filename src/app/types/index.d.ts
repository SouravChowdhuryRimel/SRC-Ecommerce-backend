import { TJwtUser } from "../modules/auth/auth.interface";
import { JwtPayloadType } from "../utils/JWT";



declare global {
    namespace Express {
        interface Request {
            user?: JwtPayloadType;
        }
    }
}
