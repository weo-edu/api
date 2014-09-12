exports.generate = function() {
  var buf = new Buffer(16);
  for (var i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random() * 256);
  }
  return buf.toString('base64').slice(0, -2);
};