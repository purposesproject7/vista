import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { EmailService } from "../services/emailService.js";

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function verifyFix() {
    console.log("Starting verification...");
    try {
        const email = process.env.EMAIL_USER;
        if (!email) {
            throw new Error("EMAIL_USER not set in .env");
        }

        console.log(`Sending OTP email to ${email}...`);
        const otp = "123456";
        const name = "Test Faculty";

        const result = await EmailService.sendOTPEmail(email, otp, name);
        console.log("Email sent successfully!");
        console.log("Message ID:", result.messageId);

    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

verifyFix();
