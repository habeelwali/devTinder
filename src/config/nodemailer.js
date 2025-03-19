const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // App password from Google
  },
});

const sendResetPasswordEmail = async (email, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request",
    html: `
      <h3>Password Reset Request</h3>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}" style="background-color:blue; color:white; padding:10px; text-decoration:none;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };
  
  return transporter.sendMail(mailOptions);
};

module.exports = sendResetPasswordEmail;
