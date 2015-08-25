var mongoose = require('mongoose')
var Schema = mongoose.Schema
var Document = mongoose.Document
var ware = require('ware')

Schema.prototype.post = function() {
  this.queue('ourPost', arguments)
}

var n = 0
Document.prototype.ourPost = function(method, fn) {
  var cache = this.__ourPost = (this.__ourPost || {})
  if(! cache[method]) {
    cache[method] = ware()
    this.on(method, function(model) {
      n++
      cache[method].run(model, function(err) {
        n--
        if(err) console.log('post hook error', method, model.kind, err, err.stack)
        checkFlush()
      })
    })
  }

  cache[method].use(fn)
}

module.exports = function() {}

var flushCbs = []
module.exports.onFlush = function(cb) {
  flushCbs.push(cb)
  checkFlush()
}

function maybeFlush() {
  if(n === 0) {
    flushCbs.forEach(function (cb) {
      cb()
    })
    flushCbs = []
  }
}

function checkFlush() {
  setTimeout(maybeFlush, 20)
}