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
 *  - likes (total number of likes)
 */

exports.likedActivity = function(to, opts, cb) {
  sendTemplate({
    to: to,
    template: 'love',
    params: {
      name: opts.name,
      settingsLink: settingsLink,
      actorLink: userLink(opts.actor.id),
      actorName: opts.actor.displayName,
      activityLink: activityLink(opts.object.id),
      activityName: opts.object.displayName,
      likes: opts.meta > 1 ? opts.meta + ' hearts' : opts.meta + ' heart'
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
      actorLink: userLink(opts.actor.id),
      actorName: opts.actor.displayName,
      activityLink: activityLink(opts.object.id),
      activityName: opts.object.displayName,
      boardName: opts.meta.displayName,
      boardLink: boardLink(opts.meta.url),
      settingsLink: settingsLink
    }
  }, cb)
}

/**
 * Followed user
 */

exports.followedUser = function (to, opts, cb) {
  sendTemplate({
    to: to,
    template: 'followed-you',
    params: {
      name: opts.name,
      actorLink: userLink(opts.actor.id),
      actorName: opts.actor.displayName,
      settingsLink: settingsLink
    }
  }, cb)
}

/**
 * Followed board
 */

exports.followedBoard = function (to, opts, cb) {
  sendTemplate({
    to: to,
    template: 'followed-board',
    params: {
      name: opts.name,
      actorLink: userLink(opts.actor.id),
      actorName: opts.actor.displayName,
      boardName: opts.object.displayName,
      boardLink: boardLink(opts.object.url),
      settingsLink: settingsLink
    }
  }, cb)
}

/**
 * Commented on activity
 */

exports.commentedOnActivity = function (to, opts, cb) {
  sendTemplate({
    to: to,
    template: 'comment',
    params: {
      name: opts.name,
      actorLink: userLink(opts.actor.id),
      actorName: opts.actor.displayName,
      activityName: opts.object.displayName,
      activityLink: activityLink(opts.object.id)
    }
  }, cb)
}

/**
 * Student joined class
 */

exports.joinedClass = function (to, opts, cb) {
  sendTemplate({
    to: to,
    template: 'joined-class',
    params: {
      actorLink: userLink(opts.actor.id),
      actorName: opts.actor.displayName,
      className: opts.object.displayName,
      classLink: classLink(opts.object.id)
    }
  }, cb)
}

/**
 * Student turns in an activity
 */

exports.turnedInActivity = function (to, opts, cb) {
  sendTemplate({
    to: to,
    template: 'turned-in-activity',
    params: {
      actorLink: userLink(opts.actor.id),
      actorName: opts.actor.displayName,
      activityName: opts.object.displayName,
      activityLink: instanceLink(opts.object.id, opts.meta.id, opts.actor.id),
      className: opts.meta.displayName,
      classLink: classLink(opts.meta.id)
    }
  }, cb)
}

/**
 * Invite students
 */

exports.inviteStudent = function (to, opts, cb) {
  sendTemplate({
    to: to,
    template: 'invite-student',
    params: {
      actorName: opts.actor.displayName,
      className: opts.group.displayName,
      code: opts.group.code
    }
  }, cb)
}

/**
 * Invite user
 */

exports.inviteUser = function(to, opts, cb) {
  sendTemplate({
    to: to,
    template: 'send-invite',
    params: {
      actorName: opts.actorName,
      actorLink: userLink(opts.actorId),
      link: inviteLink(opts.code)
    }
  }, cb)
}

exports.confirmInviteRequest = function(to, cb) {
  sendTemplate({
    to: to,
    template: 'confirm-invite',
    params: {}
  }, cb)
}

/**
 * Link generation
 */

var settingsLink = config.frontEnd + '/account/'

function inviteLink (code) {
  return config.frontEnd + '/teacher/' + code + '/'
}

function boardLink (url) {
  return config.frontEnd + url
}

function classLink (id) {
  return config.frontEnd + '/class/' + id + '/'
}

function userLink (id) {
  return config.frontEnd + '/' + id + '/'
}

function activityLink (id) {
  return config.frontEnd + '/activity/' + id + '/public/preview/'
}

function instanceLink (id, groupId, studentId) {
  return config.frontEnd + '/activity/' + id + '/' + groupId + '/instance/' + studentId + '/'
}

function resetLink (token) {
  return config.frontEnd + '/reset/' + token
}
