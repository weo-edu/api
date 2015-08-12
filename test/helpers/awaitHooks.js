var ourPost = require('lib/schema-plugin-post')

module.exports = function() {
  return (new Promise(function(resolve) {
    ourPost.onFlush(resolve)
  }))
}