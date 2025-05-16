import Issue from "../models/issue.model.js";
import nodemailer from "nodemailer";

// Create transporter for sending emails
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error("Email credentials not found in environment variables");
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    return transporter;
  } catch (error) {
    console.error("Error creating transporter:", error);
    return null;
  }
};

// Submit a new issue report
export const submitIssue = async (req, res) => {
  try {
    // First save the issue
    console.log("Saving issue to database...");
    const issue = new Issue(req.body);
    await issue.save();
    console.log("Issue saved successfully");

    // Try to send email if email configuration exists
    console.log("Attempting to send email notification...");
    const transporter = createTransporter();
    if (transporter) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: issue.email,
          subject: `Issue Report Received: ${issue.nature}`,
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Issue Report Received</h2>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <p style="margin: 5px 0;"><strong>Nature:</strong> ${issue.nature}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${issue.email}</p>
                <p style="margin: 5px 0;"><strong>Description:</strong></p>
                <div style="background-color: white; padding: 10px; border-radius: 3px; margin-top: 5px;">
                  ${issue.description}
                </div>
                ${issue.image ? '<p style="margin: 5px 0;"><strong>Image:</strong> Attached</p>' : ''}
              </div>
              <p style="color: #666; font-size: 12px;">Submitted at: ${issue.createdAt.toLocaleString()}</p>
            </div>
          `,
          attachments: issue.image ? [{
            filename: 'issue-image.jpg',
            content: issue.image.split(';base64,').pop(),
            encoding: 'base64'
          }] : []
        };

        console.log("Sending email with options:", {
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject,
        });

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.response);
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }
    } else {
      console.log("Email transporter not created. Skipping email notification.");
    }

    // Return success even if email fails
    res.status(201).json({
      message: "Issue report submitted successfully",
      issue,
      emailStatus: transporter ? "attempted" : "skipped",
    });
  } catch (error) {
    console.error("Error submitting issue:", error);
    res.status(500).json({
      error: error.message,
      details: error.stack,
    });
  }
}; 