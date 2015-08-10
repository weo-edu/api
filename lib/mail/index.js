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
    template: 'password',
    params: {
      name: opts.name,
      username: opts.username,
      actorLink: userLink(opts.actorId),
      link: resetLink(opts.token),
      settingsLink: settingsLink
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
    template: 'love',
    params: {
      name: opts.name,
      settingsLink: settingsLink,
      actorLink: userLink(opts.actorId),
      actorName: opts.actorName,
      activityLink: activityLink(opts.activityId),
      activityName: opts.activityName,
      likes: opts.likes > 1 ? opts.likes + ' hearts' : opts.likes + ' heart'
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
    template: 'pin',
    params: {
      name: opts.name,
      actorLink: userLink(opts.actorId),
      actorName: opts.actorName,
      activityLink: activityLink(opts.activityId),
      activityName: opts.activityName,
      boardName: opts.boardName,
      boardLink: boardLink(opts.boardLink),
      settingsLink: settingsLink
    }
  }, cb)
}

exports.inviteUser = function(to, opts, cb) {
  sendTemplate({
    to: to,
    template: 'invite',
    params: {
      from: opts.from,
      code: code,
      link: inviteLink(opts.code)
    }
  }, cb)
}

/**
 * Link generation
 */

var settingsLink = config.frontEnd + '/account/'

function inviteLink(code) {
  return config.frontEnd + '/signup?invite_code=' + code
}

function boardLink(url) {
  return config.frontEnd + url
}

function userLink(id) {
  return config.frontEnd + '/' + id + '/'
}

function activityLink(id) {
  return config.frontEnd + '/activity/' + id + '/public/preview/'
}

function resetLink(token) {
  return config.frontEnd + '/reset?' + qs.stringify({token: token})
}