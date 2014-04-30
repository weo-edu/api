var AsyncEventEmitter = require('async-eventemitter');

module.exports = function(Schema) {
  Schema.dispatch = function() {
    if (!this._emitter)
      this._emiiter = new AsyncEventEmitter;
    this._emitter.emit.apply(this._emitter, arguments);
  };

  Schema.use = function(name, listener) {
    if (!this._emitter)
      this._emitter = new AsyncEventEmitter;
    this._emitter.on(name, listener.bind(this));
  };
};