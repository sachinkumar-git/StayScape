const crypto = require("crypto");

require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env"), quiet: true });

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const isTest = nodeEnv === "test";

let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (isProduction) {
    throw new Error("SESSION_SECRET must be set in production.");
  }

  sessionSecret = crypto.randomBytes(32).toString("hex");
  if (!isTest) {
    console.warn("[config] SESSION_SECRET is not set; using a temporary secret.");
  }
}

const cloudinary = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
};
const cloudinaryConfigured = Boolean(cloudinary.cloudName && cloudinary.apiKey && cloudinary.apiSecret);

module.exports = {
  nodeEnv,
  isProduction,
  isTest,
  port: Number(process.env.PORT) || 8080,
  mongoUrl: process.env.MONGO_URL || "mongodb://127.0.0.1:27017/stayscape",
  sessionSecret,
  cloudinary,

  imageStorage: process.env.IMAGE_STORAGE || (cloudinaryConfigured ? "cloudinary" : "local"),
  geocodingEnabled: process.env.GEOCODING_ENABLED !== "false" && !isTest,
};
