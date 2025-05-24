import bcrypt from "bcryptjs";
import {TempUser, User} from "@/models/user";
import { connectToDatabase } from "@/lib/db";
import { NextRequest } from "next/server";
import { response } from "@/app/config/helpers";

export async function POST(
  req: NextRequest
) {
  try {
  if (req.method !== "POST") return response({ error: "Invalid route" }, 404);

  const { email, otp } = await req.json();
  if (!email || !otp) return response({ error: "Missing fields" }, 400);

  await connectToDatabase();

  const tempUser = await TempUser.findOne({ email });
  if (!tempUser)
    return response({ error: "User not found or OTP expired" }, 404);

  if (!tempUser.otpExpiry || tempUser.otpExpiry < Date.now()) {
    // await TempUser.deleteOne({ email }); // cleanup expired
    return response({ error: "OTP expired" }, 400);
  }

  const isValidOtp = await bcrypt.compare(otp, tempUser.otp);
  if (!isValidOtp) return response({ error: "Invalid OTP" }, 400);

  // Transfer to User collection
  const user = new User({
    name: tempUser.name,
    email: tempUser.email,
    password: tempUser.password,
  });

  await user.save();
  await TempUser.deleteMany({ email });

  return response({ message: "Email verified successfully, you can now login." }, 200);
}catch (err: any) {
  console.error(err)
  return response({error: err.message})
}
}
