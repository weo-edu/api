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
  return Channels.findOne(id)
}

function list (ownerId) {
  return Channels.find({ownerId})
}

/**
 * Exports
 */

exports.create = create
exports.db = Channels
exports.list = list
exports.get = get
