const OTP = require('../models/OTP');
const crypto = require('crypto');
const moment = require('moment');

/**
 * OTP Service
 * Handles OTP generation, validation, and management
 */
class OTPService {
  /**
   * Generate OTP code (6 digits)
   */
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Send OTP to email (for client admin registration)
   * In production, integrate with email service (SendGrid, AWS SES, etc.)
   * For now, we'll just log it and return it
   */
  async sendOTP(email, type = 'client_admin_registration') {
    try {
      // Generate 6-digit OTP
      const code = this.generateOTP();
      
      // Set expiration (10 minutes)
      const expiresAt = moment().add(10, 'minutes').toDate();

      // Invalidate any existing OTPs for this email and type
      await OTP.updateMany(
        { email, type, isUsed: false },
        { isUsed: true }
      );

      // Create new OTP
      const otp = await OTP.create({
        email,
        code,
        type,
        expiresAt,
      });

      // TODO: In production, send email via email service
      // For now, log it (remove in production!)
      console.log('========================================');
      console.log(`OTP for ${email}: ${code}`);
      console.log(`Expires at: ${expiresAt}`);
      console.log('========================================');

      // In production, uncomment and configure:
      // await sendEmail({
      //   to: email,
      //   subject: 'BookACut Registration OTP',
      //   html: `Your OTP code is: <strong>${code}</strong><br>Valid for 10 minutes.`
      // });

      return {
        success: true,
        message: 'OTP sent successfully',
        // In development, return OTP for testing (remove in production!)
        otp: process.env.NODE_ENV === 'development' ? code : undefined,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(email, code, type = 'client_admin_registration') {
    try {
      const otp = await OTP.findOne({
        email: email.toLowerCase().trim(),
        code,
        type,
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });

      if (!otp) {
        throw new Error('Invalid or expired OTP');
      }

      // Mark OTP as used
      otp.isUsed = true;
      await otp.save();

      return {
        success: true,
        message: 'OTP verified successfully',
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(email, type = 'client_admin_registration') {
    return await this.sendOTP(email, type);
  }
}

module.exports = new OTPService();

