const crypto = require('crypto');

/**
 * Generates a random token of specified length
 * @param {Number} length - The length of the token to generate (default 32)
 * @returns {String} - A random token string
 */
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

/**
 * Generates a unique ID with a prefix
 * @param {String} prefix - The prefix for the ID (e.g., 'STY' for stylists)
 * @param {Number} length - The length of the random part (default 8)
 * @returns {String} - A unique ID with prefix
 */
const generateUniqueId = (prefix, length = 8) => {
  const randomPart = generateRandomToken(length);
  return `${prefix}${randomPart.toUpperCase()}`;
};

/**
 * Hashes a string using SHA-256
 * @param {String} data - The string to hash
 * @returns {String} - The hashed string
 */
const hashString = (data) => {
  return crypto.createHash('sha256')
    .update(data)
    .digest('hex');
};

module.exports = {
  generateRandomToken,
  generateUniqueId,
  hashString
};