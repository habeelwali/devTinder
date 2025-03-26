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

/**
 * Sends an email dynamically based on the type.
 * @param {string} email - The recipient's email address.
 * @param {string} type - The type of email ('reset-password' | 'connect-request' | 'custom').
 * @param {string} [tokenOrMessage] - Reset token or custom message.
 */
const sendEmail = async (email, type, tokenOrMessage = "") => {
  let subject, htmlContent;

  switch (type) {
    case "reset-password":
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${tokenOrMessage}`;
      subject = "Password Reset Request";
      htmlContent = `
        <h3>Password Reset Request</h3>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" style="background-color:blue; color:white; padding:10px; text-decoration:none;">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      `;
      break;

    case "connect-request":
      subject = "New Connection Request";
      htmlContent = `
        <h3>Connection Request</h3>
        <p>You have received a new connection request.</p>
        <p>Message: ${tokenOrMessage || "No additional message provided."}</p>
        <p>Please respond at your convenience.</p>
      `;
      break;

      case "subscription":
      subject = "Thanks for Your Subscription and Welcome";
      htmlContent = `
        <h3> Dear ${email},</h3>
        <p>You have received a new connection request.</p>
        <p>Message: ${tokenOrMessage || "No additional message provided."}</p>
        <p>Thank you for trusting us.</p>
      `;
      break;

  

    default:
      throw new Error("Invalid email type specified.");
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html: htmlContent,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
