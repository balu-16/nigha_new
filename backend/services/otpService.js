import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { dbHelpers, getISTTimestamp } from '../config/database.js';

dotenv.config();

// SMS configuration - using your existing working configuration
const SMS_CONFIG = {
  secret: 'xledocqmXkNPrTesuqWr',
  sender: 'NIGHAI',
  tempid: '1207174264191607433',
  route: 'TA',
  msgtype: '1',
  baseUrl: 'http://43.252.88.250/index.php/smsapi/httpapi/'
};

// SQLite-adapted OTP Service Class
export class SQLiteOtpService {
  // Generate a 6-digit OTP
  static generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Validate Indian phone number format
  static validatePhoneNumber(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/[\s\-\+]/g, '');
    const indianMobileRegex = /^[6-9]\d{9}$/;
    return indianMobileRegex.test(cleanNumber);
  }

  // Format phone number
  static formatPhoneNumber(phoneNumber) {
    const cleanNumber = phoneNumber.replace(/[\s\-\+]/g, '');
    if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
      return cleanNumber.substring(2);
    }
    return cleanNumber;
  }

  // Check if phone number exists in SQLite database (role-specific validation)
  static async validatePhoneInDatabase(phoneNumber, role = null) {
    try {
      const user = await dbHelpers.getUserByPhone(phoneNumber);
      
      if (!user) {
        return {
          exists: false,
          userType: null,
          user: null,
          message: 'Phone number not registered in the system'
        };
      }

      // If role is specified, validate user has the required role
      if (role) {
        if (role === 'admin' && !['admin', 'superadmin'].includes(user.role)) {
          return {
            exists: false,
            userType: null,
            user: null,
            message: 'Phone number not found in admin records'
          };
        }
        
        if (role === 'customer' && user.role !== 'customer') {
          return {
            exists: false,
            userType: null,
            user: null,
            message: 'Phone number not found in customer records'
          };
        }
      }

      return {
        exists: true,
        userType: user.role,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      console.error('Error validating phone in database:', error);
      throw error;
    }
  }

  // Store OTP in SQLite database
  static async storeOTP(phoneNumber, otp, userId = null) {
    try {
      // Calculate expiry time in IST (10 minutes from now)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST offset
      const expiryTime = new Date(now.getTime() + istOffset + 10 * 60 * 1000); // 10 minutes from IST now
      const expiresAt = expiryTime.toISOString().replace('T', ' ').substring(0, 19); // Format: YYYY-MM-DD HH:MM:SS

      // Invalidate existing OTPs for this phone number
      await dbHelpers.invalidateOTPs(phoneNumber);

      // Create new OTP record
      const result = await dbHelpers.storeOTP(userId, phoneNumber, otp, expiresAt);

      console.log(`✅ OTP stored successfully for ${phoneNumber}`);
      return {
        id: result.lastID,
        phoneNumber,
        otp,
        expiresAt
      };
    } catch (error) {
      console.error('Store OTP error:', error);
      throw error;
    }
  }

  // Verify OTP from SQLite database
  static async verifyOTP(phoneNumber, otp) {
    try {
      const otpRecord = await dbHelpers.verifyOTP(phoneNumber, otp);

      if (!otpRecord) {
        console.log(`❌ Invalid or expired OTP for ${phoneNumber}`);
        return { isValid: false, message: 'Invalid or expired OTP' };
      }

      // Mark OTP as verified
      await dbHelpers.markOTPVerified(otpRecord.id);

      console.log(`✅ OTP verified successfully for ${phoneNumber}`);
      return { 
        isValid: true, 
        message: 'OTP verified successfully',
        otpRecord 
      };
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  }

  // Send OTP via SMS - using your exact working logic
  static async sendOtpSms(phoneNumber, otp) {
    try {
      console.log(`📱 [SQLite Service] Sending OTP SMS to ${phoneNumber} with OTP: ${otp}`);
      
      // Format the SMS message exactly like your working version
      const message = `Welcome to NighaTech Global Your OTP for authentication is ${otp} don't share with anybody Thank you`;
      
      // Prepare SMS API parameters exactly like your working version
      const params = new URLSearchParams({
        secret: SMS_CONFIG.secret,
        sender: SMS_CONFIG.sender,
        tempid: SMS_CONFIG.tempid,
        receiver: phoneNumber,
        route: SMS_CONFIG.route,
        msgtype: SMS_CONFIG.msgtype,
        sms: message
      });

      const smsUrl = `${SMS_CONFIG.baseUrl}?${params.toString()}`;
      console.log(`📱 [SQLite Service] SMS URL: ${smsUrl}`);

      // Send SMS using the exact same method as your working test
      const response = await fetch(smsUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Node.js SMS Service/1.0'
        }
      });

      const responseText = await response.text();
      console.log(`📱 [SQLite Service] SMS API Response Status: ${response.status}`);
      console.log(`📱 [SQLite Service] SMS API Response Text: ${responseText}`);

      if (response.status === 200) {
        console.log(`✅ [SQLite Service] SMS sent successfully to ${phoneNumber}`);
        return {
          success: true,
          message: `SMS sent successfully to ${phoneNumber}`,
          apiResponse: responseText,
          status: response.status
        };
      } else {
        console.log(`❌ [SQLite Service] SMS failed for ${phoneNumber}`);
        return {
          success: false,
          error: `SMS API returned status ${response.status}: ${responseText}`,
          apiResponse: responseText,
          status: response.status
        };
      }
    } catch (error) {
      console.error('📱 [SQLite Service] SMS Service Error:', error);
      return {
        success: false,
        error: `Failed to send SMS: ${error.message}`,
        exception: error.name
      };
    }
  }

  // Complete OTP flow: generate, store, and send (with role-based validation)
  static async sendOTP(phoneNumber, name = null, role = null) {
    try {
      console.log(`📱 [SQLite Service] Starting OTP process for ${phoneNumber} with role: ${role}`);
      
      // Format and validate phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      if (!this.validatePhoneNumber(formattedPhone)) {
        throw new Error('Invalid phone number format. Must be a valid 10-digit Indian mobile number starting with 6-9');
      }

      // Validate phone number exists in database with role-specific check
      const phoneValidation = await this.validatePhoneInDatabase(formattedPhone, role);
      
      if (!phoneValidation.exists) {
        const roleMessage = role === 'admin' ? 'admin records' : role === 'customer' ? 'customer records' : 'database';
        throw new Error(`Phone number not registered in ${roleMessage}. Please contact administrator to register your phone number.`);
      }

      console.log(`📱 [SQLite Service] Phone number validated for ${phoneValidation.userType}: ${phoneValidation.user.name}`);

      // Generate OTP
      const otp = this.generateOTP();
      console.log(`📱 [SQLite Service] Generated OTP: ${otp}`);
      
      // Store OTP in database
      await this.storeOTP(formattedPhone, otp, phoneValidation.user.id);
      
      // Send OTP via SMS using the working method
      const smsResult = await this.sendOtpSms(formattedPhone, otp);
      
      return {
        success: true,
        message: 'OTP sent successfully',
        phoneNumber: formattedPhone,
        userType: phoneValidation.userType,
        user: phoneValidation.user,
        smsResult,
        otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only show OTP in development
      };
    } catch (error) {
      console.error('[SQLite Service] Send OTP error:', error);
      throw error;
    }
  }

  // Cleanup expired OTPs
  static async cleanupExpiredOTPs() {
    try {
      const result = await dbHelpers.cleanupExpiredOTPs();
      console.log(`✅ Cleaned up expired OTPs`);
      return { success: true, message: `Cleaned up expired OTPs` };
    } catch (error) {
      console.error('Cleanup expired OTPs error:', error);
      throw error;
    }
  }
}

export default SQLiteOtpService;