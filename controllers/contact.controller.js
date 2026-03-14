const sendEmail = require('../utils/sendEmail');

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide all required fields: name, email, subject, and message',
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address',
      });
    }

    // Prepare email content for admin notification
    const adminEmailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .content {
              background-color: #ffffff;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #8b5cf6;
              color: white;
              padding: 20px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .field {
              margin-bottom: 15px;
            }
            .label {
              font-weight: bold;
              color: #6b7280;
              font-size: 14px;
              text-transform: uppercase;
            }
            .value {
              margin-top: 5px;
              padding: 10px;
              background-color: #f3f4f6;
              border-radius: 5px;
            }
            .message-box {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin-top: 20px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <div class="header">
                <h2>New Contact Form Submission</h2>
              </div>
              <div style="padding: 20px;">
                <div class="field">
                  <div class="label">From</div>
                  <div class="value">${name}</div>
                </div>
                <div class="field">
                  <div class="label">Email</div>
                  <div class="value">${email}</div>
                </div>
                <div class="field">
                  <div class="label">Subject</div>
                  <div class="value">${subject}</div>
                </div>
                <div class="message-box">
                  <div class="label">Message</div>
                  <div style="margin-top: 10px; white-space: pre-wrap;">${message}</div>
                </div>
                <div class="footer">
                  <p>This message was sent via the ElderEase Contact Us form.</p>
                  <p>Timestamp: ${new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Prepare confirmation email for user
    const userEmailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9fafb;
            }
            .content {
              background-color: #ffffff;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background-color: #8b5cf6;
              color: white;
              padding: 20px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .check-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .message {
              padding: 20px;
              text-align: center;
            }
            .details {
              background-color: #f3f4f6;
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              <div class="header">
                <div class="check-icon">✓</div>
                <h2>Message Received!</h2>
              </div>
              <div class="message">
                <p>Dear ${name},</p>
                <p>Thank you for contacting ElderEase. We have received your message and our team will review it shortly.</p>
                <p>We typically respond within 24-48 hours during business days.</p>
                <div class="details">
                  <p><strong>Your Message Details:</strong></p>
                  <p><strong>Subject:</strong> ${subject}</p>
                  <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <p style="margin-top: 30px;">If you have any urgent concerns, please call us at <strong>+94 11 234 5678</strong></p>
              </div>
              <div class="footer">
                <p>Best regards,<br>The ElderEase Team</p>
                <p style="margin-top: 20px;">
                  <a href="mailto:support@elderease.com" style="color: #8b5cf6;">support@elderease.com</a> | 
                  +94 11 234 5678
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email to admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'support@elderease.com';
    await sendEmail({
      email: adminEmail,
      subject: `New Contact Form: ${subject}`,
      html: adminEmailHTML,
    });

    // Send confirmation email to user
    await sendEmail({
      email: email,
      subject: 'We received your message - ElderEase',
      html: userEmailHTML,
    });

    res.status(200).json({
      status: 'success',
      message: 'Your message has been sent successfully. We will get back to you soon!',
      data: {
        name,
        email,
        subject,
        submittedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit contact form. Please try again later.',
      error: error.message,
    });
  }
};
