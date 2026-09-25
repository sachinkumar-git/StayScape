const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],
  },
  { timestamps: true }
);

userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
  usernameLowerCase: true,
  errorMessages: {
    IncorrectPasswordError: "Incorrect email or password.",
    IncorrectUsernameError: "Incorrect email or password.",
    UserExistsError: "An account with this email already exists.",
  },
});

userSchema.virtual("firstName").get(function firstName() {
  return this.name.split(" ")[0];
});

userSchema.methods.hasSaved = function hasSaved(listingId) {
  return this.wishlist.some((id) => id.equals(listingId));
};

module.exports = mongoose.model("User", userSchema);
