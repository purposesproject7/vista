import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("Loaded configuration:");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "****" : "NOT SET");

async function testEmail() {
    try {
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        console.log("Attempting to verify transporter...");
        await transporter.verify();
        console.log("Transporter verified successfully.");

        console.log("Attempting to send test email...");
        const info = await transporter.sendMail({
            from: \`VIT Faculty Portal <\${process.env.EMAIL_USER}>\`,
      to: process.env.EMAIL_USER, // Send to self
      subject: "Test Email from Reproduction Script",
      text: "This is a test email to verify nodemailer configuration.",
    });

    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

testEmail();
