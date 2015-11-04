var alphabet = require('lib/config').hashIds.alphabet
var crypto = require('crypto')

module.exports = function (len) {
  var bytes = [].slice.call(crypto.randomBytes(len || 6))

  return bytes.map(function(byte) {
    return alphabet[byte % alphabet.length]
  }).join('')
}