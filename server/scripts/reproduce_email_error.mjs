import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("Starting reproduction script...");

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

if (!emailUser || !emailPass) {
  console.error("Missing EMAIL_USER or EMAIL_PASS in .env");
  process.exit(1);
}

// Sanitize password by removing spaces
const sanitizedPass = emailPass.replace(/\s+/g, "");

console.log(\`User: \${emailUser}\`);
console.log(\`Pass (original length): \${emailPass.length}\`);
console.log(\`Pass (sanitized length): \${sanitizedPass.length}\`);

async function testEmail() {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: emailUser,
      pass: sanitizedPass, // Try with sanitized password
    },
    logger: true,
    debug: true,
  });

  try {
    console.log("Verifying transporter with sanitized password...");
    await transporter.verify();
    console.log("Verification SUCCESS!");
    
    // Convert current time to string for the email body
    const timeString = new Date().toISOString();
    
    const info = await transporter.sendMail({
        from: \`"Vista Test" <\${emailUser}>\`,
        to: emailUser,
        subject: "Vista Debug Email",
        text: \`This is a test email sent at \${timeString}. If you receive this, email sending is working.\`,
    });
    console.log("Email sent: " + info.response);

  } catch (error) {
    console.error("Verification/Send FAILED:", error);
  }
}

testEmail();
