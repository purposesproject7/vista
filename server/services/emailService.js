import nodemailer from "nodemailer";
import { logger } from "../utils/logger.js";

export class EmailService {
  /**
   * Create email transporter
   */
  static createTransporter() {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      throw new Error("Email credentials not configured");
    }

    return nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  /**
   * Send OTP email
   */
  static async sendOTPEmail(emailId, otp, facultyName) {
    try {
      const transporter = this.createTransporter();

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

                  <!-- Header -->
                  <tr>
                    <td style="background-color: #2455a3; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">VIT Faculty Portal</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333333; margin: 0 0 20px 0;">Password Reset Request</h2>
                      <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                        Hello <strong>${facultyName}</strong>,
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                        We received a request to reset your password. Use the following OTP to proceed:
                      </p>

                      <!-- OTP Box -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; border: 2px dashed #2455a3;">
                            <span style="font-size: 32px; font-weight: bold; color: #2455a3; letter-spacing: 8px;">${otp}</span>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                        ⏰ This code will expire in <strong>10 minutes</strong>.
                      </p>
                      <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 10px 0 0 0;">
                        🔒 If you didn't request this, please ignore this email and your password will remain unchanged.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px;">
                      <p style="color: #999999; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} VIT Faculty Portal. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `VIT Faculty Portal <${process.env.EMAIL_USER}>`,
        to: emailId,
        subject: "Password Reset OTP - VIT Faculty Portal",
        html: htmlContent,
      };

      const info = await transporter.sendMail(mailOptions);

      logger.info("otp_email_sent", {
        emailId,
        messageId: info.messageId,
      });

      return info;
    } catch (error) {
      logger.error("send_otp_email_error", {
        emailId,
        error: error.message,
      });

      throw new Error(
        error.code === "EAUTH"
          ? "Email authentication failed. Please contact administrator."
          : "Failed to send email. Please try again.",
      );
    }
  }

  /**
   * Send password changed notification
   */
  static async sendPasswordChangedNotification(emailId, facultyName) {
    try {
      const transporter = this.createTransporter();

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Changed</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

                  <!-- Header -->
                  <tr>
                    <td style="background-color: #28a745; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✓ Password Changed Successfully</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                        Hello <strong>${facultyName}</strong>,
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                        Your password has been changed successfully.
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                        If you didn't make this change, please contact support immediately.
                      </p>
                      <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                        Best regards,<br>
                        <strong>VIT Faculty Portal Team</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px;">
                      <p style="color: #999999; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} VIT Faculty Portal. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: `VIT Faculty Portal <${process.env.EMAIL_USER}>`,
        to: emailId,
        subject: "Password Changed - VIT Faculty Portal",
        html: htmlContent,
      });

      logger.info("password_changed_notification_sent", { emailId });
    } catch (error) {
      logger.error("send_notification_error", {
        emailId,
        error: error.message,
      });
      // Don't throw - this is a non-critical notification
    }
  }

  /**
   * Send welcome email (optional)
   */
  static async sendWelcomeEmail(emailId, facultyName, temporaryPassword) {
    try {
      const transporter = this.createTransporter();

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to VIT Faculty Portal</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

                  <!-- Header -->
                  <tr>
                    <td style="background-color: #2455a3; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to VIT Faculty Portal</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                        Hello <strong>${facultyName}</strong>,
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                        Your account has been created successfully. Here are your login credentials:
                      </p>

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                        <tr>
                          <td style="padding: 15px; background-color: #f8f9fa; border-radius: 4px;">
                            <p style="margin: 0 0 10px 0; color: #666666;"><strong>Email:</strong> ${emailId}</p>
                            <p style="margin: 0; color: #666666;"><strong>Temporary Password:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px;">${temporaryPassword}</code></p>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0;">
                        ⚠️ <strong>Important:</strong> Please change your password after your first login.
                      </p>
                      <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 10px 0 0 0;">
                        Best regards,<br>
                        <strong>VIT Faculty Portal Team</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px;">
                      <p style="color: #999999; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} VIT Faculty Portal. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const info = await transporter.sendMail({
        from: `VIT Faculty Portal <${process.env.EMAIL_USER}>`,
        to: emailId,
        subject: "Welcome to VIT Faculty Portal",
        html: htmlContent,
      });

      logger.info("welcome_email_sent", {
        emailId,
        messageId: info.messageId,
      });

      return info;
    } catch (error) {
      logger.error("send_welcome_email_error", {
        emailId,
        error: error.message,
      });
      // Don't throw - this is a non-critical email
    }
  }

  /**
   * Send broadcast email
   */
  static async sendBroadcastEmail(recipientEmails, subject, message) {
    if (!recipientEmails.length) return;

    try {
      const transporter = this.createTransporter();

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

                  <!-- Header -->
                  <tr>
                    <td style="background-color: #2455a3; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">VIT Faculty Portal: New Broadcast</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333333; margin: 0 0 20px 0;">${subject}</h2>
                      <div style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0; white-space: pre-wrap;">
                        ${message}
                      </div>
                      
                      <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                        Best regards,<br>
                        <strong>VIT Faculty Portal Team</strong>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px;">
                      <p style="color: #999999; font-size: 12px; margin: 0;">
                        © ${new Date().getFullYear()} VIT Faculty Portal. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      // Split recipients into chunks to avoid limits
      const chunkSize = 50;
      for (let i = 0; i < recipientEmails.length; i += chunkSize) {
        const chunk = recipientEmails.slice(i, i + chunkSize);

        await transporter.sendMail({
          from: `VIT Faculty Portal <${process.env.EMAIL_USER}>`,
          bcc: chunk, // Use BCC for privacy
          subject: subject || "New Broadcast Message",
          html: htmlContent,
        });
      }

      logger.info("broadcast_email_sent", {
        recipientCount: recipientEmails.length,
        subject,
      });

      return true;
    } catch (error) {
      console.error("Failed to send broadcast email:", error);
      logger.error("send_broadcast_email_error", {
        error: error.message,
      });
      // Don't throw to prevent blocking the HTTP response
    }
  }
}
