import mail from "./Mailsend_code.mjs";
import dotenv from "dotenv";
dotenv.config();

const sendsmail = async ({ to, subject, message, senderName, replyTo }) => {
  try {
    await mail.sendMail({
      from: `"${senderName || "Admin"}" <${process.env.EMAIL_USER}>`,
      replyTo: replyTo || process.env.EMAIL_USER,
      to,
      subject,
      text: message
    });
    return true;
  } catch (error) {
    console.log("Mail error:", error);
    return false;
  }
};

export default sendsmail;
