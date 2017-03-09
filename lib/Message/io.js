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
  return id => {
    Message
      .get(id.toString())
      .then(msg => {
        io.sockets.to(msg.channel).send({
          data: msg,
          verb: 'add',
          params: {
            channel: msg.channel
          },
          model: 'Message'
        })
      },
      err => {
        console.log('err', err)
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
