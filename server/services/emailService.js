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

    // Sanitize password by removing spaces (common issue with copy-paste)
    const sanitizedPass = emailPass.replace(/\s+/g, "");

    return nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: emailUser,
        pass: sanitizedPass,
      },
      // Add timeouts to prevent hanging
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
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
  /**
   * Send duplicate project notification to guide
   */
  static async sendDuplicateProjectNotification(guideEmail, guideName, duplicates) {
    if (!guideEmail || duplicates.length === 0) return;

    try {
      const transporter = this.createTransporter();

      const projectListHtml = duplicates
        .map(d => `<li><strong>${d.regNo}</strong> - ${d.studentName} (Project: ${d.projectName})</li>`)
        .join('');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <div style="background-color: #f4f4f4; padding: 20px;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #d32f2f; margin-top: 0;">Action Required: Duplicate Project Definitions</h2>
              <p>Dear ${guideName},</p>
              <p>The following student projects attempted to be uploaded have resulted in a duplicate entry error (likely due to conflicting Project Names or Student ID).</p>
              <p><strong>This prevents mark entry and further processing for these students.</strong></p>
              <p>Please review and update the project details (Title/Team) to resolve conflicts.</p>
              <ul style="background-color: #fff3e0; padding: 15px 30px; border-radius: 4px;">
                ${projectListHtml}
              </ul>
              <p style="margin-top: 30px; font-size: 14px; color: #666;">Regards,<br>VIT Faculty Portal Team</p>
            </div>
          </div>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: `VIT Faculty Portal <${process.env.EMAIL_USER}>`,
        to: guideEmail,
        subject: "Urgent: Duplicate Project Conflicts Detected",
        html: htmlContent,
      });

      logger.info("duplicate_project_notification_sent", { guideEmail, count: duplicates.length });
      return true;
    } catch (error) {
      logger.error("send_duplicate_notification_error", { guideEmail, error: error.message });
      return false;
    }
  }

  /**
   * Send project upload error notification to guide faculty
   */
  static async sendProjectUploadErrorNotification(
    guideEmail,
    guideName,
    uploaderEmail,
    uploaderName,
    errors,
    uploadContext
  ) {
    if (!guideEmail || !errors || errors.length === 0) return false;

    try {
      const transporter = this.createTransporter();

      // Build error list HTML
      const errorListHtml = errors
        .map(
          (err) => `
          <li style="margin-bottom: 15px; padding: 10px; background-color: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">
            <strong style="color: #e65100;">Project: ${err.name || 'N/A'}</strong><br>
            <span style="font-size: 14px; color: #666;">Team Members: ${err.teamMembers ? err.teamMembers.join(', ') : 'N/A'}</span><br>
            <span style="font-size: 14px; color: #d32f2f; font-weight: 500;">Error: ${err.error}</span>
          </li>
        `
        )
        .join('');

      const contextInfo = uploadContext
        ? `<p style="color: #666666; font-size: 14px; margin: 10px 0;">
             <strong>Upload Context:</strong> ${uploadContext.schoolName || uploadContext.school || 'N/A'} - 
             ${uploadContext.programmeName || uploadContext.program || 'N/A'} - 
             ${uploadContext.year || 'N/A'}
           </p>`
        : '';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Upload Errors</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

                  <!-- Header -->
                  <tr>
                    <td style="background-color: #d32f2f; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⚠️ Action Required: Project Upload Errors</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                        Dear <strong>${guideName}</strong>,
                      </p>
                      <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 20px 0;">
                        A bulk project upload was attempted by <strong>${uploaderName || uploaderEmail}</strong>, but some projects under your guidance could not be created due to the following errors:
                      </p>

                      ${contextInfo}

                      <!-- Error List -->
                      <div style="margin: 30px 0;">
                        <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">Failed Projects (${errors.length}):</h3>
                        <ul style="list-style: none; padding: 0; margin: 0;">
                          ${errorListHtml}
                        </ul>
                      </div>

                      <!-- Instructions -->
                      <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 30px 0;">
                        <h4 style="color: #1565c0; margin: 0 0 10px 0; font-size: 16px;">📋 Next Steps:</h4>
                        <ol style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                          <li>Review the error messages above</li>
                          <li>Fix the issues in your project data (e.g., resolve duplicate names, reassign students)</li>
                          <li>Contact ${uploaderName || 'the administrator'} with the corrected project details</li>
                          <li>Re-upload the corrected projects</li>
                        </ol>
                      </div>

                      <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                        If you have any questions, please reply to this email to contact ${uploaderName || 'the administrator'} directly.
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

      const mailOptions = {
        from: `VIT Faculty Portal <${process.env.EMAIL_USER}>`,
        to: guideEmail,
        replyTo: uploaderEmail, // Set reply-to as uploader's email
        subject: "Action Required: Project Upload Errors",
        html: htmlContent,
      };

      await transporter.sendMail(mailOptions);

      logger.info("project_upload_error_notification_sent", {
        guideEmail,
        uploaderEmail,
        errorCount: errors.length,
      });

      return true;
    } catch (error) {
      logger.error("send_project_upload_error_notification_error", {
        guideEmail,
        error: error.message,
      });
      return false;
    }
  }
}
