var stopWords = [/test/ig, /activity/ig, /assignment/ig, /warmup/ig, /grade/ig]

module.exports = function (query) {
  query = query.replace(/-/g, ' ')
  stopWords.forEach(function(stopWord) {
    query = query.replace(stopWord, '')
  })
  return query
}
