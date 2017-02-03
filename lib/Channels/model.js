/**
 * Imports
 */

const io = require('./io')
const db = require('lib/monk')
const Channels = db.get('channels')

/**
 * Model
 */

function create (name, ownerId) {
  // Convert ObjectId's to strings, if they aren't
  // already
  ownerId = ownerId.toString()

  return Channels
    .insert({
      name,
      createdAt: +new Date(),
      ownerId
    })
    .then(
      channel => {
        io.emit('add', channel._id)
        return channel
      })

}

function get (id) {
  id = id.toString()
  return Channels.findOne(id)
}

function list (ownerId) {
  ownerId = ownerId.toString()

  return Channels.find({ownerId})
}

/**
 * Exports
 */

exports.create = create
exports.db = Channels
exports.list = list
exports.get = get
