import crypto from "crypto";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please add a valid email address"],
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  firstname: { type: String },
  lastname: { type: String },
  phone: { type: String },
  role: {
    type: String,
    enum: ["admin", "agency"],
    default: "agency",
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
    select: false,
    validate: {
      validator: (value) =>
        /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(value),
      message:
        "Password must be at least 8 characters long and include one uppercase letter, one number, and one special character",
    },
  },
  active: {
    type: Boolean,
    default: true,
  },
  otp: { type: String, select: false },
  otpExpiresAt: { type: Date, select: false },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpire: { type: Date, select: false },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 🔒 Encrypt password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // Allow only one admin
  if (this.role === "admin") {
    const adminExists = await this.constructor.findOne({ role: "admin" });
    if (adminExists && this.isNew) {
      return next(new Error("An admin account already exists."));
    }
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔑 Generate JWT
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_JWT_EXPIRE,
    }
  );
};

// ✅ Compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// 🔁 Generate reset password token
UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

export default mongoose.model("User", UserSchema);
