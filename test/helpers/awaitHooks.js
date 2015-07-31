var ourPost = require('lib/schema-plugin-post')
var _ = require('lodash')

module.exports = function() {
  var args = _.toArray(arguments)
  var fn = this
  if (!_.isFunction(fn)) {
    fn = args[args.length - 1]
    args = args.slice(0, -1)
  }


  ourPost.onFlush(function() {
    fn.apply(null, [null].concat(args))
  })
}