/**
 * Imports
 */

var Messages = require('./model')
var Users = require('lib/User').model
var index = require('@f/index')

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

/**
 * Exports
 */

module.exports = {
  create,
  get
}
