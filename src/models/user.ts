import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String, // hashed
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const tempUserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  otp: String,
  otpExpiry: Date,
});

const TempUser =
  mongoose.models.TempUser || mongoose.model("TempUser", tempUserSchema);
export { TempUser, User };
