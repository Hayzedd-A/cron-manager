import {transporter} from "@/app/config/nodemailer"
const sendEmail = async (email: string, text: string, subject: string) => {
   return await transporter.sendMail({
     from: process.env.EMAIL_USER,
     to: email,
     subject,
     text,
   });
}

export const sendOtpEmail = async(reciever: string, otp: string) => {
  let content = `Your OTP code is: ${otp}. It expires in 30 minutes.`
  let subject = "Your OTP Code for Signup Verification";
  return await sendEmail(reciever, content, subject)
}

export const sendForgetPasswordEmail = async (reciever: string, otp: string) => {
  let content = `Your OTP code is: ${otp}. It expires in 30 minutes.`;
  let subject = "Your OTP Code for password recovery";
  return await sendEmail(reciever, content, subject);
};