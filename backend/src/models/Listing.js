const mongoose = require("mongoose");
const { PROPERTY_TYPE_KEYS, AMENITY_KEYS, LISTING_STATUSES, MAX_PHOTOS } = require("../constants/listing");

const { Schema } = mongoose;

const pointSchema = new Schema(
  {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false }
);

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    filename: String,
    provider: { type: String, enum: ["cloudinary", "local", "external"], default: "external" },
  },
  { _id: false }
);

const listingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    propertyType: { type: String, enum: PROPERTY_TYPE_KEYS, required: true },
    location: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    geometry: { type: pointSchema, default: undefined },
    pricePerNight: { type: Number, required: true, min: 1 },
    cleaningFee: { type: Number, default: 0, min: 0 },
    maxGuests: { type: Number, required: true, min: 1 },
    bedrooms: { type: Number, default: 1, min: 0 },
    beds: { type: Number, default: 1, min: 1 },
    bathrooms: { type: Number, default: 1, min: 0 },
    amenities: [{ type: String, enum: AMENITY_KEYS }],
    images: {
      type: [imageSchema],
      validate: {
        validator: (images) => images.length >= 1 && images.length <= MAX_PHOTOS,
        message: `A listing needs between 1 and ${MAX_PHOTOS} photos.`,
      },
    },
    host: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: LISTING_STATUSES, default: "active" },
    ratingAverage: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

listingSchema.index({ status: 1, propertyType: 1, pricePerNight: 1 });
listingSchema.index({ status: 1, ratingAverage: -1 });

listingSchema.methods.isHostedBy = function isHostedBy(user) {
  if (!user) return false;
  const hostId = this.host._id || this.host;
  return hostId.equals(user._id);
};

module.exports = mongoose.model("Listing", listingSchema);
