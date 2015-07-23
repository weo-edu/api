/**
 * Imports
 */
var assert = require('assert')
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
  checkOpts(opts, ['name', 'username', 'actorId', 'token'])

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
  checkOpts(opts, ['name', 'actorId', 'actorName', 'activityId', 'activityName', 'likes'])

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
  checkOpts(opts, ['name', 'actorId', 'actorName', 'activityId', 'activityName', 'boardName', 'boardLink'])

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

/**
 * Link generation
 */

var settingsLink = config.frontEnd + '/account/'

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

/**
 * Check arguments to make sure we don't forget things
 */

function checkOpts(opts, required) {
  required.forEach(function(arg) {
    assert.ok(opts[arg])
  })
}