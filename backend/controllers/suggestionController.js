import Suggestion from "../models/suggestion.model.js";
import nodemailer from "nodemailer";

// Create transporter for sending emails
const createTransporter = () => {
  console.log("Creating email transporter...");
  console.log("Using email:", process.env.EMAIL_USER);

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

    // Verify the connection configuration
    transporter.verify(function (error, success) {
      if (error) {
        console.error("Transporter verification failed:", error);
      } else {
        console.log("Server is ready to take our messages");
      }
    });

    return transporter;
  } catch (error) {
    console.error("Error creating transporter:", error);
    return null;
  }
};

// Submit a new suggestion
export const submitSuggestion = async (req, res) => {
  try {
    // First save the suggestion
    console.log("Saving suggestion to database...");
    const suggestion = new Suggestion(req.body);
    await suggestion.save();
    console.log("Suggestion saved successfully");

    // Try to send email if email configuration exists
    console.log("Attempting to send email notification...");
    const transporter = createTransporter();
    if (transporter) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: "flakeysky.0418@gmail.com",
          subject: `New Suggestion: ${suggestion.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">New Suggestion Received</h2>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                <p style="margin: 5px 0;"><strong>Name:</strong> ${
                  suggestion.name
                }</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${
                  suggestion.email
                }</p>
                <p style="margin: 5px 0;"><strong>Subject:</strong> ${
                  suggestion.subject
                }</p>
                <p style="margin: 5px 0;"><strong>Description:</strong></p>
                <div style="background-color: white; padding: 10px; border-radius: 3px; margin-top: 5px;">
                  ${suggestion.description}
                </div>
              </div>
              <p style="color: #666; font-size: 12px;">Submitted at: ${suggestion.createdAt.toLocaleString()}</p>
            </div>
          `,
        };

        console.log("Sending email with options:", {
          from: mailOptions.from,
          to: mailOptions.to,
          subject: mailOptions.subject,
        });

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.response);
      } catch (emailError) {
        console.error(
          "Failed to send email notification. Detailed error:",
          emailError
        );
        if (emailError.code === "EAUTH") {
          console.error(
            "Authentication failed. Please check your email credentials."
          );
        }
      }
    } else {
      console.log(
        "Email transporter not created. Skipping email notification."
      );
    }

    // Return success even if email fails
    res.status(201).json({
      message: "Suggestion submitted successfully",
      suggestion,
      emailStatus: transporter ? "attempted" : "skipped",
    });
  } catch (error) {
    console.error("Error submitting suggestion:", error);
    res.status(500).json({
      error: error.message,
      details: error.stack,
    });
  }
};

// Get all suggestions
export const getAllSuggestions = async (req, res) => {
  try {
    const suggestions = await Suggestion.find().sort({ createdAt: -1 });
    res.status(200).json(suggestions);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update suggestion status
export const updateSuggestionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const suggestion = await Suggestion.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!suggestion) {
      return res.status(404).json({ message: "Suggestion not found" });
    }

    res.status(200).json(suggestion);
  } catch (error) {
    console.error("Error updating suggestion status:", error);
    res.status(500).json({ error: error.message });
  }
};
