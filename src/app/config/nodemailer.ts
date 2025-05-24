import nodemailer from "nodemailer";
const host = process.env.MAIL_SERVER;
const user = process.env.MAIL_USERNAME;
const pass = process.env.MAIL_PASSWORD;

export const transporter = nodemailer.createTransport({
  host: host,
  port: 465,
  secure: true, // true for port 465, false for other ports
  auth: {
    user: user,
    pass: pass,
  },
});
