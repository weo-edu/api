/**
 * Imports
 * @type {[type]}
 */
var mongo = require('lib/mongo')
var hashid = require('lib/hashid')

/**
 * Vars
 */
var invites

mongo.connect.then(function() {
  invites = mongo.collection('invites')
})

/**
 * Model
 */
function validate(code) {
  return invites
    .findOne({code: code, used: false})
    .then(function(invite) {
      return !! invite
    })
}

function send(user, email) {
  var code = hashid()
  invites
    .insert({
      from: req.me.toKey(),
      email: email,
      code: code,
      used: false
    })
    .then(function() {
      return (new Promise(function(resolve) {
        mail.inviteUser(email, {
          from: req.me.displayName,
          code: code
        }, function(err) { err ? reject(err) : resolve() })
      }))
    })
}

/**
 * Exports
 */
module.exports = {
  validate: validate,
  send: send
}