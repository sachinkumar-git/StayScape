const mongoose = require("mongoose");
const { BOOKING_STATUSES, CANCELLED_BY } = require("../constants/booking");
const { today } = require("../utils/dates");

const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    listing: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    guest: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    host: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1 },
    nights: { type: Number, required: true, min: 1 },
    pricePerNight: { type: Number, required: true },
    cleaningFee: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: BOOKING_STATUSES, default: "confirmed" },
    cancelledBy: { type: String, enum: CANCELLED_BY },
    cancelledAt: Date,
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } }
);

bookingSchema.index({ listing: 1, status: 1, checkIn: 1, checkOut: 1 });

bookingSchema.virtual("phase").get(function phase() {
  if (this.status === "cancelled") return "cancelled";
  const now = today();
  if (this.checkOut <= now) return "completed";
  if (this.checkIn <= now) return "in_progress";
  return "upcoming";
});

bookingSchema.virtual("isCancellable").get(function isCancellable() {
  return this.phase === "upcoming";
});

bookingSchema.methods.involves = function involves(user) {
  if (!user) return false;
  const id = (ref) => ref._id || ref;
  return id(this.guest).equals(user._id) || id(this.host).equals(user._id);
};

module.exports = mongoose.model("Booking", bookingSchema);
