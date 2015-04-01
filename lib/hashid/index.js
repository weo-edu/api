const crypto = require('crypto');

module.exports = function(charset, length) {
  return function() {
    return (new Promise(function(resolve, reject) {
      crypto.randomBytes(length, function(err, buf) {
        err
          ? reject(err)
          : resolve(encode(buf, charset));
      });
    });
  };
};

function encode(bytes, charset) {
  let str = '';
  for(let i = 0; i < bytes.length; i++)
    str += charset[bytes[i] % charset.length];
  return str;
}