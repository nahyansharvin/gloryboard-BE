import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  user_type: { type: String, enum: ["admin", "rep", "user"], required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  number: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  department: { type: String, required: true }, // Department name (e.g., "Computer Science")
  year_of_study: { type: Number, required: true }, // Year of study (e.g., 1, 2, 3, 4)
  total_score: { type: Number, default: 0 }, // Running total score for the user
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateJWT = function () {
  return jwt.sign(
    {
      _id: this._id,
      user_type: this.user_type,
      email: this.email,
      name: this.name,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
    }
  );
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
    }
  );
};

export const User = mongoose.model("User", userSchema);
