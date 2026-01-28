const getPasswordResetEmailTemplate = (resetUrl, userName) => {
  return {
    subject: 'Password Reset Request - ElderEase Admin Portal',
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
          .code-box { background: #fff; border: 2px dashed #d1d5db; padding: 15px; text-align: center; font-family: monospace; font-size: 18px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛡️ Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hello${userName ? ' ' + userName : ''},</p>
            
            <p>We received a request to reset your password for your ElderEase Administrator account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <div class="code-box">${resetUrl}</div>
            
            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul style="margin: 10px 0;">
                <li>This link will expire in <strong>10 minutes</strong></li>
                <li>This link can only be used once</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.</p>
            
            <p>Best regards,<br><strong>ElderEase Admin Team</strong></p>
          </div>
          
          <div class="footer">
            <p><strong>ElderEase Administrator Portal</strong></p>
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} ElderEase. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Password Reset Request - ElderEase Admin Portal

Hello${userName ? ' ' + userName : ''},

We received a request to reset your password for your ElderEase Administrator account.

Please click the following link to reset your password:
${resetUrl}

IMPORTANT SECURITY INFORMATION:
- This link will expire in 10 minutes
- This link can only be used once
- If you didn't request this reset, please ignore this email
- Never share this link with anyone

If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.

Best regards,
ElderEase Admin Team

---
ElderEase Administrator Portal
This is an automated message, please do not reply to this email.
© ${new Date().getFullYear()} ElderEase. All rights reserved.
    `,
  };
};

module.exports = {
  getPasswordResetEmailTemplate,
};
