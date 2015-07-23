/**
 * Imports
 */
var qs = require('qs')
var config = require('lib/config')
var sendTemplate = require('mandrill-send-template')(config.mandrillApiKey)

/**
 * Exports
 */

/**
 * opts:
 *  - name (user's name)
 *  - token (reset token)
 */
exports.forgotPassword = function(to, opts, cb) {
  sendTemplate({
    to: to,
    template: 'password-reset',
    params: {
      name: opts.name,
      link: resetLink(opts.token)
    }
  }, cb)
}

/**
 * opts:
 *  - name (user's name)
 *  - actorId (liker's id or username)
 *  - actorName (actor's name)
 *  - activityId (id of liked activity)
 *  - activityName (name of activity)
 */
exports.likedActivity = function(to, opts, cb) {
  sendTemplate({
    to: to,
    template: 'liked-your-activity',
    params: {
      name: opts.name,
      actorLink: userLink(opts.actorId),
      actorName: opts.actorName,
      activityLink: activityLink(opts.activityId),
      activityName: opts.activityName
    }
  }, cb)
}

/**
 * opts:
 *  - name (user's name)
 *  - actorId (pinner's id or username)
 *  - actorName (actor's name)
 *  - activityId (id of pinned activity)
 *  - activityName (name of activity)
 */
exports.pinnedActivity = function(to, opts, cb) {
  sendTemplate({
    to: to,
    template: 'pinned-your-activity',
    params: {
      name: opts.name,
      actorLink: userLink(opts.actorId),
      actorName: opts.actorName,
      activityLink: activityLink(opts.activityId),
      activityName: opts.activityName
    }
  }, cb)
}

/**
 * Link generation
 */

function userLink(id) {
  return config.frontEnd + '/' + id + '/'
}

function activityLink(id) {
  return config.frontEnd + '/activity/' + id + '/public/preview/'
}

function resetLink(token) {
  return config.frontEnd + '/reset?' + qs.stringify({token: token})
}