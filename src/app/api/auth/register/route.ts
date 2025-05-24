import { NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { TempUser, User } from "@/models/user";
import { connectToDatabase } from "@/lib/db";
import { sendOtpEmail } from "@/app/services/email.serivce";
import { NextRequest } from "next/server";
import { response } from "@/app/config/helpers";

export async function POST(req: NextRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).end();
    const { name, email, password } = await req.json();
    if (!name || !email || !password)
      return response({ error: "missing fields" }, 400);

    await connectToDatabase();

    // Check if user already exists in User or TempUser
    const existingUser = await User.findOne({ email });
    if (existingUser) return response({ error: "Email already exist" }, 400);

    await TempUser.deleteMany({ email });

    // Generate OTP and hash it
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to TempUser collection
    const tempUser = new TempUser({
      name,
      email,
      password: hashedPassword,
      otp: hashedOtp,
      otpExpiry: Date.now() + 30 * 60 * 1000, // 30 mins expiry
    });

    // Send OTP via email
    await tempUser.save();
    await sendOtpEmail(tempUser.email, otp);

    return response({ message: "OTP sent to your email" }, 200);
  } catch (error) {
    console.error("Email sending failed:", error);
    response({ error: "Failed to send OTP email" });
  }
}

// resend otp
export async function PATCH(req: NextRequest, res: NextApiResponse) {
  try {
    if (req.method !== "PATCH") return res.status(404).end();

    const { email } = await req.json();
    if (!email) {
      return response({ error: "No email specified" }, 400);
    }
    const tempUser = await TempUser.findOne({ email });
    if (!tempUser)
      return response({
        error:
          "No user found or OTP completed, maybe you might need to sign up again or try loggin in",
      });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    tempUser.otp = hashedOtp;
    tempUser.expiry = Date.now() + 30 * 60 * 1000;

    // Send OTP via email
    await tempUser.save();
    await sendOtpEmail(tempUser.email, otp);
    return response({ message: "OTP sent to your email" }, 200);
  } catch (err) {
    console.error(err);
    return response({ error: "Failed to send OTP email" }, 500);
  }
}
