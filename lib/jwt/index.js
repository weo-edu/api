/**
 * Imports
 */

var jwt = require('jsonwebtoken')
var config = require('lib/config')

/**
 * JWT
 */

function sign (obj) {
  return jwt.sign(obj, config.jwtKey)
}

function verify (token) {
  return jwt.verify(token, config.jwtKey)
}

/**
 * Exports
 */

module.exports = {
  sign: sign,
  verify: verify
}
