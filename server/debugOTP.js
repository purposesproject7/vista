
import mongoose from "mongoose";
import dotenv from "dotenv";
import { EmailService } from "./services/emailService.js";
import { OTPService } from "./services/otpService.js";
import Faculty from "./models/facultySchema.js";
import { logger } from "./utils/logger.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// Mock response object
const res = {
    status: (code) => ({
        json: (data) => console.log(`Response [${code}]:`, JSON.stringify(data, null, 2))
    })
};

// Mock request object
const req = {
    body: {
        emailId: "purposesproject7@gmail.com" // Use the sender email as recipient for testing
    },
    requestId: "debug-123"
};

async function debugOTP() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        const { emailId } = req.body;
        console.log(`Testing OTP for email: ${emailId}`);

        // Check if faculty exists or create one for testing
        let faculty = await Faculty.findOne({ emailId });
        if (!faculty) {
            console.log("Faculty not found. Creating test faculty...");
            faculty = await Faculty.create({
                name: "Test Faculty",
                emailId: emailId,
                employeeId: "TEST001",
                phoneNumber: "1234567890",
                password: "password123",
                school: "SCOPE",
                role: "faculty"
            });
            console.log("Test faculty created.");
        } else {
            console.log("Faculty found.");
        }

        console.log("Generating OTP...");
        const otp = OTPService.generateOTP();
        console.log(`OTP Generated: ${otp}`);

        console.log("Storing OTP...");
        OTPService.storeOTP(emailId, otp, faculty.name);
        console.log("OTP Stored.");

        console.log("Sending Email...");
        try {
            const info = await EmailService.sendOTPEmail(emailId, otp, faculty.name);
            console.log("Email sent successfully:", info);
            res.status(200).json({ success: true, message: "OTP sent" });
        } catch (emailError) {
            console.error("Email sending failed:", emailError);
            res.status(500).json({ success: false, message: emailError.message });
        }

    } catch (err) {
        console.error("Global Error:", err);
    } finally {
        // Clean up test user if created? No, keep it for now or delete it.
        // await Faculty.deleteOne({ emailId: req.body.emailId });
        await mongoose.disconnect();
    }
}

debugOTP();
