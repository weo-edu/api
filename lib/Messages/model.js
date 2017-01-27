/**
 * Imports
 */

const db = require('lib/monk')
const Users = require('lib/User').model
const Messages = db.get('messages')

/**
 * Model
 */

function create (channel, text, userId, type = 'message') {
  return Messages
    .insert({
      createdAt: +new Date(),
      channel,
      text,
      userId,
      type
    })
}

function get (id, extended = true) {
  return Messages
    .findOne(id)
    .then(
      msg => extended && msg ? prepareOne(msg) : msg
    )
}

function prepareOne (msg) {
  return Users
    .findOne(msg.userId)
    .then(
      user => {
        msg.actor = user.toKey()
        return msg
      })
}

function prepareAll (msgs) {
  return Users
    .find({_id: {$in: msgs.map(msg => msg.userId)}})
    .then(
      users => {
        const userIndex = index(user => user._id, users)
        msgs.forEach(msg => msg.actor = userIndex[msg.userId].toKey())
        return msgs
      })
}

/**
 * Exports
 */

exports.create = create
exports.get = get
exports.prepareOne = prepareOne
exports.prepareAll = prepareAll
exports.db = Messages
