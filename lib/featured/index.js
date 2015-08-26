var FEATURED = process.env.WEO_API_FEATURED || ''
var featured = FEATURED.split(',')

module.exports = function () {
  return featured || []
}
