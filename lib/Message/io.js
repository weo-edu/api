/**
 * Imports
 */

const Emitter = require('events')
const emitter = module.exports = new Emitter()

const Message = require('./model')
const io = require('lib/io')

/**
 * Publish messages
 */

emitter.on('update', send('change'))
emitter.on('add', send('add'))

function send (verb) {
  return msg => {
    io.sockets.to(msg.channel).send({
      data: msg,
      verb: 'add',
      params: {
        channel: msg.channel
      },
      model: 'Message'
    })
  }
}

function subscribe (req, res) {
  const channel = req.param('channel')
  channel && req.socket.join(channel)
  res.send(200)
}

function unsubscribe (req, res) {
  const channel = req.param('channel')
  channel && req.socket.leave(channel)
  res.send(200)
}

/**
 * Exports
 */

module.exports.subscribe = subscribe
module.exports.unsubscribe = unsubscribe
