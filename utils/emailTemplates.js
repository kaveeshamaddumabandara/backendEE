const getPasswordResetEmailTemplate = (resetUrl, userName, resetToken) => {
  return {
    subject: 'Password Reset Request - ElderEase',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .code-box { background: #fff; border: 2px dashed #d1d5db; padding: 15px; text-align: center; font-family: monospace; font-size: 18px; margin: 20px 0; word-break: break-all; }
          .token-box { background: #eff6ff; border: 2px solid #2563eb; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
          .token-label { font-size: 13px; color: #6b7280; margin-bottom: 8px; }
          .token-value { font-family: monospace; font-size: 15px; font-weight: bold; color: #1e40af; word-break: break-all; letter-spacing: 0.5px; }
          .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hello${userName ? ' ' + userName : ''},</p>
            
            <p>We received a request to reset your password for your ElderEase account.</p>
            
            <p>Click the button below to reset your password (works best on desktop/browser):</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="code-box">${resetUrl}</div>

            <hr class="divider" />

            <p><strong>Using the ElderEase Mobile App?</strong></p>
            <p>Open the mobile app, go to <em>Forgot Password → Reset Password</em>, and enter the reset code below:</p>

            <div class="token-box">
              <div class="token-label">Your Mobile Reset Code</div>
              <div class="token-value">${resetToken || ''}</div>
            </div>
            
            <div class="warning">
              <strong>Important Security Information:</strong>
              <ul style="margin: 10px 0;">
                <li>This link and reset code will expire in <strong>10 minutes</strong></li>
                <li>They can only be used once</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link or code with anyone</li>
              </ul>
            </div>
            
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.</p>
            
            <p>Best regards,<br><strong>ElderEase Team</strong></p>
          </div>
          
          <div class="footer">
            <p><strong>ElderEase</strong></p>
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ElderEase. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Password Reset Request - ElderEase

Hello${userName ? ' ' + userName : ''},

We received a request to reset your password for your ElderEase account.

RESET VIA BROWSER (Desktop/Web):
Please click the following link to reset your password:
${resetUrl}

RESET VIA MOBILE APP:
Open the ElderEase mobile app, go to Forgot Password → Reset Password,
and enter the reset code below:

  Reset Code: ${resetToken || ''}

IMPORTANT SECURITY INFORMATION:
- This link and reset code will expire in 10 minutes
- They can only be used once
- If you didn't request this reset, please ignore this email
- Never share this link or code with anyone

If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.

Best regards,
ElderEase Team

---
ElderEase
This is an automated message, please do not reply to this email.
© ${new Date().getFullYear()} ElderEase. All rights reserved.
    `,
  };
};

// ─── Admin: new caregiver registration alert ────────────────────────────────
const getAdminNewCaregiverTemplate = (caregiverName, caregiverEmail, adminPortalUrl) => ({
  subject: 'New Caregiver Registration – Action Required',
  html: `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
      .container{max-width:600px;margin:0 auto;padding:20px}
      .header{background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0}
      .content{background:#f9fafb;padding:30px;border:1px solid #e5e7eb}
      .button{display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;margin:20px 0}
      .footer{background:#1f2937;color:#9ca3af;padding:20px;text-align:center;font-size:12px;border-radius:0 0 10px 10px}
      .info-box{background:#eff6ff;border-left:4px solid #2563eb;padding:15px;margin:20px 0}
    </style></head><body>
    <div class="container">
      <div class="header"><h1>New Caregiver Registration</h1></div>
      <div class="content">
        <p>Hello Admin,</p>
        <p>A new caregiver has submitted a registration request and is awaiting your review and approval.</p>
        <div class="info-box">
          <strong>Applicant Details:</strong><br/>
          Name: <strong>${caregiverName}</strong><br/>
          Email: <strong>${caregiverEmail}</strong>
        </div>
        <p>Please log in to the admin portal to review their application, verify submitted documents, and approve or reject the request.</p>
        <div style="text-align:center">
          <a href="${adminPortalUrl || '#'}" class="button">Review Application</a>
        </div>
        <p>If the applicant is approved, they will automatically receive an email with instructions to pay the LKR 1,000 registration fee and activate their account.</p>
      </div>
      <div class="footer">
        <p><strong>ElderEase</strong> – This is an automated message, please do not reply.</p>
        <p>&copy; ${new Date().getFullYear()} ElderEase. All rights reserved.</p>
      </div>
    </div></body></html>
  `,
  text: `
New Caregiver Registration – Action Required

Hello Admin,

A new caregiver has submitted a registration request:
  Name:  ${caregiverName}
  Email: ${caregiverEmail}

Please log in to the admin portal and navigate to Pending Requests to review, approve, or reject this application.

${adminPortalUrl ? `Admin Portal: ${adminPortalUrl}` : ''}

ElderEase Team
  `,
});

// ─── Caregiver: approved – pay registration fee ──────────────────────────────
const getCaregiverApprovedTemplate = (caregiverName) => ({
  subject: 'Your ElderEase Application Has Been Approved!',
  html: `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
      .container{max-width:600px;margin:0 auto;padding:20px}
      .header{background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0}
      .content{background:#f9fafb;padding:30px;border:1px solid #e5e7eb}
      .steps{background:#f0fdf4;border-left:4px solid #10b981;padding:15px;margin:20px 0}
      .footer{background:#1f2937;color:#9ca3af;padding:20px;text-align:center;font-size:12px;border-radius:0 0 10px 10px}
    </style></head><body>
    <div class="container">
      <div class="header"><h1>🎉 Application Approved!</h1></div>
      <div class="content">
        <p>Hello ${caregiverName},</p>
        <p>Congratulations! Your caregiver registration application has been <strong>reviewed and approved</strong> by the ElderEase admin team.</p>
        <div class="steps">
          <strong>Next Step – Activate Your Account:</strong>
          <ol>
            <li>Open the <strong>ElderEase mobile app</strong> and log in with your registered email and password.</li>
            <li>Navigate to the <strong>Payments</strong> section.</li>
            <li>Pay the one-time <strong>LKR 1,000 registration fee</strong> to fully activate your account.</li>
          </ol>
        </div>
        <p>Once the payment is confirmed, your profile will become visible to care receivers and you can start accepting bookings.</p>
        <p>Welcome to the ElderEase caregiver community!</p>
        <p>Best regards,<br/><strong>ElderEase Team</strong></p>
      </div>
      <div class="footer">
        <p><strong>ElderEase</strong> – This is an automated message, please do not reply.</p>
        <p>&copy; ${new Date().getFullYear()} ElderEase. All rights reserved.</p>
      </div>
    </div></body></html>
  `,
  text: `
Congratulations ${caregiverName}!

Your caregiver registration application has been approved.

Next Step – Activate Your Account:
1. Open the ElderEase mobile app and log in.
2. Go to the Payments section.
3. Pay the one-time LKR 1,000 registration fee to activate your account.

Once paid, your profile will be visible to care receivers.

Welcome aboard!
ElderEase Team
  `,
});

// ─── Caregiver: rejected ─────────────────────────────────────────────────────
const getCaregiverRejectedTemplate = (caregiverName, reason) => ({
  subject: 'Update on Your ElderEase Caregiver Application',
  html: `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
      .container{max-width:600px;margin:0 auto;padding:20px}
      .header{background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff;padding:30px;text-align:center;border-radius:10px 10px 0 0}
      .content{background:#f9fafb;padding:30px;border:1px solid #e5e7eb}
      .reason-box{background:#fef2f2;border-left:4px solid #dc2626;padding:15px;margin:20px 0}
      .footer{background:#1f2937;color:#9ca3af;padding:20px;text-align:center;font-size:12px;border-radius:0 0 10px 10px}
    </style></head><body>
    <div class="container">
      <div class="header"><h1>Application Status Update</h1></div>
      <div class="content">
        <p>Hello ${caregiverName},</p>
        <p>Thank you for your interest in joining ElderEase as a caregiver. After reviewing your application, we regret to inform you that we are <strong>unable to approve your registration</strong> at this time.</p>
        ${reason ? `
        <div class="reason-box">
          <strong>Reason:</strong><br/>${reason}
        </div>` : ''}
        <p>If you believe this decision was made in error, or if you have updated documentation to provide, please contact our support team at <strong>${process.env.EMAIL_USER || 'support@elderease.com'}</strong>.</p>
        <p>Best regards,<br/><strong>ElderEase Team</strong></p>
      </div>
      <div class="footer">
        <p><strong>ElderEase</strong> – This is an automated message, please do not reply.</p>
        <p>&copy; ${new Date().getFullYear()} ElderEase. All rights reserved.</p>
      </div>
    </div></body></html>
  `,
  text: `
Hello ${caregiverName},

Thank you for applying to join ElderEase as a caregiver. After reviewing your application, we are unable to approve your registration at this time.

${reason ? `Reason: ${reason}\n` : ''}
If you believe this was an error or have updated documentation, please contact us at ${process.env.EMAIL_USER || 'support@elderease.com'}.

ElderEase Team
  `,
});

module.exports = {
  getPasswordResetEmailTemplate,
  getAdminNewCaregiverTemplate,
  getCaregiverApprovedTemplate,
  getCaregiverRejectedTemplate,
};
