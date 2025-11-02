import "dotenv/config";

export const configs = {
  port: process.env.PORT,
  env: "development",
  jwt: {
    accessToken_expires: process.env.ACCESS_TOKEN_EXPIRES,
    refreshToken_expires: process.env.REFRESH_TOKEN_EXPIRES,
    accessToken_secret: process.env.ACCESS_TOKEN_SECRET,
    refreshToken_secret: process.env.REFRESH_TOKEN_SECRET,
    resetToken_secret: process.env.RESET_PASSWORD_SECRET,
    resetToken_expires: process.env.RESET_PASSWORD_EXPIRES,
    front_end_url: process.env.FRONTEND_URL || "http://localhost:5000",
  },
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS || 10,
  db_url: process.env.DB_URL,
  email: {
    app_email: process.env.APP_USER_EMAIL,
    app_password: process.env.APP_PASSWORD,
  },
  cloudinary: {
    cloud_name: process.env.CLOUD_NAME,
    cloud_api_key: process.env.CLOUD_API_KEY,
    cloud_api_secret: process.env.CLOUD_API_SECRET,
  },
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY,
  }
};
