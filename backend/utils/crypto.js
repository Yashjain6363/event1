const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';

// Derive a 32-byte key from JWT_SECRET
function getKey() {
    const secret = process.env.JWT_SECRET || 'default_secret_key';
    return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a plain-text password using AES-256-CBC
 * Returns "iv:encryptedData" as a hex string
 */
function encryptPassword(plainText) {
    const key = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an encrypted password back to plain text
 * Input format: "iv:encryptedData" (hex)
 */
function decryptPassword(encryptedText) {
    const key = getKey();
    const [ivHex, encryptedHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = { encryptPassword, decryptPassword };
