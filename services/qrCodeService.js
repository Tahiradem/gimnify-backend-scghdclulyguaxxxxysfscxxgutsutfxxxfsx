const QRCode = require('qrcode');

class QRCodeService {
  static async generateQRCode(data) {
    try {
      // Generate QR code as a base64 string
      const qrDataURL = await QRCode.toDataURL(data);
      return qrDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  static async generateQRForUser(user) {
    const data = JSON.stringify({
      userId: user._id.toString(),
      email: user.email,
      username: user.userName,
      phone: user.phone
    });
    
    const qrCodeBase64 = await this.generateQRCode(data);
    return qrCodeBase64;
  }

  static async decodeQRData(data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      throw new Error('Invalid QR code data');
    }
  }
}

module.exports = QRCodeService;