/**
 * Imports
 */

const Messages = require('./model')

/**
 * Actions
 */

function create (req, res, next) {
  const {channel, text, userId = req.me.id, type} = req.body

  Messages
    .create(channel, text, userId)
    .then(
      msg => res.json(msg),
      next
    )
}

function get (req, res, next) {
  Messages
    .get(req.param('id'))
    .then(
      msg => msg ? res.json(msg) : res.send(404),
      next
    )
}

function list (req, res, next) {
  const channel = req.param('channel')
  const skip = req.page.skip
  const limit = req.page.limit

  Messages
    .list(channel, skip, limit)
    .then(
      msgs => res.json(msgs),
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
