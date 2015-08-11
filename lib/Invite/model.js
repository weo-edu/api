/**
 * Imports
 */

var mongo = require('lib/mongo')
var hashid = require('lib/hashid')
var mail = require('lib/mail')
var config = require('lib/config')
var Mailchimp = require('mailchimp')

/**
 * Vars
 */

var Invites
var mailchimp = Mailchimp({
  apiKey: config.mailchimp.apiKey,
  dc: config.mailchimp.datacenter
})

mongo.connect.then(function() {
  Invites = mongo.collection('invites')
})

/**
 * Model
 */

function validate(code) {
  return Invites
    .findOne({code: code, used: false})
    .then(function(invite) {
      return !! invite
    })
}

function send(user, email) {
  var code = hashid()
  return Invites
    .insert({
      from: user.toKey(),
      email: email,
      code: code,
      used: false
    })
    .then(function() {
      return (new Promise(function(resolve, reject) {
        mail.inviteUser(email, {
          actorName: user.displayName,
          actorId: user.id,
          code: code
        }, function(err) { err ? reject(err) : resolve() })
      }))
    })
}

function use (code, user) {
  return Invites
    .findOne({code: code})
    .set('used', true)
    .set('to', user.toKey())
}

function request (email) {
  return mailchimp
    .subscribe(config.mailchimp.inviteListId, email)
    .then(function () {
      return (new Promise(function(resolve, reject) {
        mail.confirmInviteRequest(email, function(err) {
          err ? reject(err) : resolve()
        })
      }))
    })
}

/**
 * Exports
 */

module.exports = {
  validate: validate,
  send: send,
  use: use,
  request: request
}