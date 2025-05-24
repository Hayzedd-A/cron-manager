import { NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { TempUser, User } from "@/models/user";
import { connectToDatabase } from "@/lib/db";
import {
  sendForgetPasswordEmail,
} from "@/app/services/email.serivce";
import { NextRequest } from "next/server";
import { response } from "@/app/config/helpers";

export async function POST(req: NextRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).end();
    const { email } = await req.json();
    if (!email) return response({ error: "You need to send your email" }, 400);

    await connectToDatabase();

    // Check if user already exists in User or TempUser
    const user = await User.findOne({ email });
    if (!user) return response({ error: "Email does not exist" }, 400);

    await TempUser.deleteMany({ email });

    // Generate OTP and hash it
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Save to TempUser collection
    const tempUser = new TempUser({
      name: user.name,
      email,
      otp: hashedOtp,
      otpExpiry: Date.now() + 30 * 60 * 1000, // 30 mins expiry
    });

    // Send OTP via email
    await tempUser.save();
    await sendForgetPasswordEmail(tempUser.email, otp);

    return response({ message: "OTP sent to your email" }, 200);
  } catch (error) {
    console.error("Email sending failed:", error);
    response({ error: "Failed to send OTP email" });
  }
}

export async function PATCH(req: NextRequest, res: NextApiResponse) {
  try {
    if (req.method !== "PATCH") return res.status(404).end();

    const { email, otp, password } = await req.json();
    if (!email || !otp || !password) {
      return response({ error: "Missing field(s)" }, 400);
    }
    const tempUser = await TempUser.findOne({ email });
    if (!tempUser)
      return response({
        error: "No user found or OTP completed",
      });

    const isValidOtp = await bcrypt.compare(otp, tempUser.otp);
    if (!isValidOtp || tempUser.otpExpiry < Date.now()) {
      // await TempUser.deleteOne({ email }); // cleanup expired
      return response({ error: "Invalid OTP or expired" }, 400);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    Promise.all([
      User.findOneAndUpdate({ email }, { $set: { password: hashedPassword } }),
      TempUser.deleteOne({email})
    ]);
    
    return response({ message: "Password changed successfully" }, 200);
  } catch (err) {
    console.error(err);
    return response({ error: "Failed to send OTP email" }, 500);
  }
}
