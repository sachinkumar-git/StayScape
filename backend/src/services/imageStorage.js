const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const env = require("../config/env");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "public", "uploads");
const EXTENSIONS = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

let cloudinaryClient;
function cloudinary() {
  if (!cloudinaryClient) {
    cloudinaryClient = require("cloudinary").v2;
    cloudinaryClient.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
    });
  }
  return cloudinaryClient;
}

function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary().uploader.upload_stream(
      { folder: "stayscape/listings", resource_type: "image" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(file.buffer);
  });
}

async function saveImage(file) {
  if (env.imageStorage === "cloudinary") {
    const result = await uploadToCloudinary(file);
    return { url: result.secure_url, filename: result.public_id, provider: "cloudinary" };
  }

  const filename = `${crypto.randomUUID()}${EXTENSIONS[file.mimetype] || ""}`;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
  return { url: `/uploads/${filename}`, filename, provider: "local" };
}

async function deleteImage(image) {
  if (!image?.filename) return;
  try {
    if (image.provider === "cloudinary") {
      await cloudinary().uploader.destroy(image.filename);
    } else if (image.provider === "local") {
      await fs.unlink(path.join(UPLOAD_DIR, path.basename(image.filename)));
    }
  } catch (err) {
    console.warn(`[images] Could not delete ${image.filename}: ${err.message}`);
  }
}

module.exports = { saveImage, deleteImage };
