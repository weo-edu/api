/**
 * Imports
 */

var curry = require('@micro-js/curry-once')
var toPromise = require('@micro-js/thunk-to-promise')

/**
 * Exports
 */

module.exports = curry(function (collection, where, opts) {
  return toPromise(curry.call(collection(), collection().count)(
    where(opts.query, opts)
  ))
})
