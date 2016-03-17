/**
 * Imports
 */

var assign = require('@micro-js/assign')
var isUndefined = require('@micro-js/is-undefined')

/**
 * Expose where
 */

module.exports = where

function where (opts) {
  opts = opts || {}
  return function (query, queryOpts) {
    query = query || ''
    var options = assign({}, opts, queryOpts)
    var actorId = options.user ? options.user.id : undefined
    var tags = [].concat(queryOpts.tags || []).filter(Boolean)

    var where = {
      'contexts.descriptor.id': 'public',
      shareType: 'share'
    }

    if (tags.length) where['tags.displayName'] = {$all: tags}
    if (query) where.$text = {$search: query}

    if (!isUndefined(options.published)) {
      where.published = options.published
    } else  {
      options.published = true
    }


    if (!isUndefined(options.fork))
      where.fork = options.fork

    if (options.actor && actorId) {
      where['actor.id'] = actorId
    }

    return where
  }
}
