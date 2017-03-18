/**
 * Imports
 */

const db = require('lib/monk')
const User = require('lib/User').model
const Messages = db.get('messages')
const index = require('@f/index')
const ObjectId = require('mongodb').ObjectID
const io = require('./io')

/**
 * Model
 */

function create (channel, text = '', userId, type = 'message') {
  // Convert ObjectId's to strings if they aren't
  // already
  channel = channel.toString()
  userId = userId.toString()

  return Messages
    .insert({
      createdAt: +new Date(),
      channel,
      text,
      userId,
      type
    })
    .then(msg => {
      io.emit('add', msg._id)
      return msg
    })
}

function get (id, extended = true) {
  id = id.toString()

  return Messages
    .findOne(id)
    .then(msg => extended && msg ? prepareOne(msg) : msg)
}

function list (channel, skip, limit) {
  channel = channel.toString()

  return Messages
    .find({channel}, {skip, limit})
    .then(prepareAll)
}

function prepareOne (msg) {
  return new Promise((resolve, reject) => {
    User
      .findOne({_id: ObjectId(msg.userId)})
      .exec((err, user) => {
        if (err) return reject(err)
        msg.actor = user.toKey()
        resolve(msg)
      })
  })
}

function prepareAll (msgs) {
  return new Promise((resolve, reject) => {
    User
    .find({_id: {$in: msgs.map(msg => ObjectId(msg.userId))}})
    .exec((err, users) => {
      if (err) return reject(err)

      const userIndex = index(user => user._id, users)
      msgs.forEach(msg => msg.actor = userIndex[msg.userId].toKey())
      resolve(msgs)
    })
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
exports.list = list
