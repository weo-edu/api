/**
 * Imports
 */

const Emitter = require('events')
const emitter = module.exports = new Emitter()

const throttle = require('@f/throttle')
const Schools = require('./model')
const io = require('lib/io')

/**
 * Publish messages
 */

emitter.on('update', send('change'))
emitter.on('add', send('add'))

function send (verb) {
  return id => {
    Schools
      .get(id)
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

module.exports.subscribe = subscribe
module.exports.unsubscribe = unsubscribe
