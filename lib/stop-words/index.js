var stopWords = [/test/ig, /activity/ig, /assignment/ig, /warmup/ig, /grade/ig]

module.exports = function (query) {
  var replaced = replaceWords(query)

  // Only remove stop words if there are other
  // words to supplement them. e.g. if someone
  // writes 'test' don't translate that to ''
  return replaced ? replaced : query
}

function replaceWords (query) {
  query = query.replace(/-/g, ' ')
  stopWords.forEach(function(stopWord) {
    query = query.replace(stopWord, '')
  })
  return query
}
