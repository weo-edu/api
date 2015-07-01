/**
 * Modules
 */
var _fastly = require('fastly')
var request = require('superagent')
var config = require('lib/config')
var errors = require('lib/errors')
var Avatar = require('./model')
var avatars = require('@weo-edu/avatars')
var isUrl = require('is-url')
var fs = require('fs')

/**
 * Vars
 */
var fastly = _fastly(config.fastly.apiKey)
var avatarServer = config.avatarServer.slice(0, 2) === '//'
  ? config.avatarServer.slice(2)
  : config.avatarServer

var missingImageError = errors
  .Client('Missing image')
  .error('required', 'image')


/**
 * Actions
 */
exports.get = function(req, res, next) {
  var id = req.param('id')

  Avatar.get(id, function(err, url) {
    if(err) return next(err)

    // Reply with the actual image file
    getAvatar(url)
      .pipe(res)
  })
}

exports.set = function(req, res, next) {
  var id = req.me.id
  var url = req.body.url

  // Validate body
  if(! url) return next(missingImageError)

  // Save new avatar
  Avatar.set(id, url, function(err) {
    if(err) return next(err)

    // Invalidate cache
    purgeAvatar(id, function(err) {
      if(err) return next(err)

      // Emit change event and finish response
      req.me.emitProfileEvent('avatar', url)
      res.status(200).end()
    })
  })
}

/**
 * Helpers
 */
function getAvatar(urlOrName) {
  return isUrl(urlOrName)
    ? request.get(urlOrName)
    : fs.createReadStream(avatars[urlOrName])
}

function purgeAvatar(id, cb) {
  // If we're not using a cdn, skip the purge
  if(! config.fastly.avatarServiceId)
    return cb()

  fastly.purge(avatarServer, '/avatar/' + id, cb)
}