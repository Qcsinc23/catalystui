import { jest } from '@jest/globals';
import nodemailer from 'nodemailer';
import { sendEmail, generatePasswordResetEmail, verifyEmailConfig } from '../email';
import config from '../../config';

// Mock nodemailer
jest.mock('nodemailer');

describe('Email Utility', () => {
  let mockTransporter: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock functions
    const mockSendMail = jest.fn();
    const mockVerify = jest.fn();

    // Setup mock responses
    mockSendMail.mockImplementation(() => Promise.resolve({ messageId: 'test-id' }));
    mockVerify.mockImplementation(() => Promise.resolve());

    // Setup mock transporter
    mockTransporter = {
      sendMail: mockSendMail,
      verify: mockVerify,
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
  });

  describe('sendEmail', () => {
    const testEmail = {
      to: 'test@example.com',
      subject: 'Test Subject',
      text: 'Test content',
      html: '<p>Test content</p>',
    };

    it('should send an email successfully', async () => {
      await sendEmail(testEmail);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: config.email.from,
        to: testEmail.to,
        subject: testEmail.subject,
        text: testEmail.text,
        html: testEmail.html,
      });
    });

    it('should throw an error when email sending fails', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      await expect(sendEmail(testEmail)).rejects.toThrow('Failed to send email');
      expect(mockTransporter.sendMail).toHaveBeenCalled();
    });

    it('should work with only text content', async () => {
      const textOnlyEmail = {
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test content',
      };

      await sendEmail(textOnlyEmail);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: config.email.from,
        to: textOnlyEmail.to,
        subject: textOnlyEmail.subject,
        text: textOnlyEmail.text,
        html: undefined,
      });
    });

    it('should work with only HTML content', async () => {
      const htmlOnlyEmail = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
      };

      await sendEmail(htmlOnlyEmail);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: config.email.from,
        to: htmlOnlyEmail.to,
        subject: htmlOnlyEmail.subject,
        text: undefined,
        html: htmlOnlyEmail.html,
      });
    });
  });

  describe('generatePasswordResetEmail', () => {
    const testEmail = 'test@example.com';
    const testToken = 'test-token-123';

    it('should generate correct email content', () => {
      const resetEmail = generatePasswordResetEmail(testEmail, testToken);
      const expectedResetLink = `${config.app.baseUrl}/reset-password?token=${testToken}`;

      expect(resetEmail).toEqual({
        to: testEmail,
        subject: 'Password Reset Request',
        text: expect.stringContaining(expectedResetLink),
        html: expect.stringContaining(expectedResetLink),
      });

      // Verify email content includes important information
      expect(resetEmail.text).toContain('expire in 1 hour');
      expect(resetEmail.html).toContain('expire in 1 hour');
      expect(resetEmail.text).toContain('If you did not request this');
      expect(resetEmail.html).toContain('If you did not request this');
    });

    it('should include properly formatted HTML', () => {
      const resetEmail = generatePasswordResetEmail(testEmail, testToken);
      
      expect(resetEmail.html).toContain('<h2>');
      expect(resetEmail.html).toContain('<p>');
      expect(resetEmail.html).toContain('<a href=');
      expect(resetEmail.html).toMatch(/<br>/);
    });
  });

  describe('verifyEmailConfig', () => {
    it('should return true when email configuration is valid', async () => {
      const result = await verifyEmailConfig();
      
      expect(result).toBe(true);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should return false when email configuration is invalid', async () => {
      mockTransporter.verify.mockRejectedValue(new Error('Invalid config'));

      const result = await verifyEmailConfig();
      
      expect(result).toBe(false);
      expect(mockTransporter.verify).toHaveBeenCalled();
    });
  });
});
