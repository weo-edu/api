var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Document = mongoose.Document;
var ware = require('ware');

Schema.prototype.post = function() {
  this.queue('ourPost', arguments);
};

var n = 0;
Document.prototype.ourPost = function(method, fn) {
  var cache = this.__ourPost = (this.__ourPost || {});

  if(! cache[method]) {
    cache[method] = ware();
    this.on(method, function(model) {
      n++;
      cache[method].run(model, function(err) {
        n--;
        if(err) console.log('post hook error', method, model.kind, err);
        checkFlush();
      });
    });
  }

  cache[method].use(fn);
};

module.exports = function() {};

var flushCb;
module.exports.onFlush = function(cb) {
  flushCb = cb;
  checkFlush();
};

function maybeFlush() {
  if(n === 0) {
    flushCb && flushCb();
    flushCb = null;
  }
}

function checkFlush() {
  setTimeout(maybeFlush, 20);
}