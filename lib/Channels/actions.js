/**
 * Imports
 */

var Channels = require('./model')

/**
 * Actions
 */

function create (req, res, next) {
  const {name, ownerId = req.me.id} = req.body

  return Channels
    .create(name, ownerId)
    .then(
      channel => res.json(channel),
      next
    )
}

function get (req, res, next) {
  Channels
    .get(req.param('id'))
    .then(
      channel => channel ? res.json(channel) : res.send(404),
      next
    )
}

function list (req, res, next) {
  Channels
    .list(req.param('ownerId'))
    .then(
      channels => channels ? res.json(channels) : res.send(404),
      next
    )
}

/**
 * Exports
 */

module.exports = {
  create,
  get,
  list
}
