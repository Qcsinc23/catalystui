import nodemailer from 'nodemailer';
import config from '../config';

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email');
  }
}

export function generatePasswordResetEmail(email: string, token: string): EmailOptions {
  const resetLink = `${config.app.baseUrl}/reset-password?token=${token}`;
  
  return {
    to: email,
    subject: 'Password Reset Request',
    text: `
      You have requested to reset your password.
      
      Please click on the following link to reset your password:
      ${resetLink}
      
      If you did not request this, please ignore this email.
      
      This link will expire in 1 hour.
      
      Best regards,
      QCS Management System Team
    `,
    html: `
      <h2>Password Reset Request</h2>
      <p>You have requested to reset your password.</p>
      <p>Please click on the following link to reset your password:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you did not request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
      <br>
      <p>Best regards,<br>QCS Management System Team</p>
    `
  };
}

// Verify email configuration is working
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}
