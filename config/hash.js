/**
 * Config object for the node-password-hash library
 * which we use to hash passwords
 * @url https://github.com/davidwood/node-password-hash
 */
module.exports.hash = {
  algorithm: 'sha256',
  saltLength: 16,
  iterations: 5
};