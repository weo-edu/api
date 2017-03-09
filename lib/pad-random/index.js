module.exports = function (len, str) {
  str = str || ''
  if(str.length >= len) return str

  var n = len - str.length
  var extra = Math.floor(Math.random() * Math.pow(10, n))
  return str + extra
}
