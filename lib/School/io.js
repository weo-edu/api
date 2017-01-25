/**
 * Imports
 */

const throttle = require('@f/throttle')
const Schools = require('./model')
const Emitter = require('events')
const io = require('lib/io')

/**
 * Constants
 */

const emitter = new Emitter()

/**
 * Publish messages
 */

emitter.on('update', send('change'))
emitter.on('add', send('add'))

function send (verb) {
  return id => {
    Schools
      .findOne(id)
      .then(data => io.sockets.to(id).send({
        data,
        verb,
        params: {id},
        model: 'School'
      }))
  }
}

function subscribe (req, res) {
  const id = req.param('id')
  id && req.socket.join(id)
  res.send(200)
}

function unsubscribe (req, res) {
  const id = req.param('id')
  id && req.socket.leave(id)
  res.send(200)
}

/**
 * Exports
 */

module.exports = emitter
module.exports.subscribe = subscribe
module.exports.unsubscribe = unsubscribe
