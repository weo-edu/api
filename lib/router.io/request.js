var _ = require('lodash');

function Req(data, socket) {
  _.extend(this, data);
  this.method = this.method.toUpperCase();
  this.socket = socket;
  this.sockets = socket.nsp;
};

module.exports = Req;

Req.prototype.param = function(name, defaultValue){
  var params = this.params || {};
  var body = this.body || {};
  var query = this.query || {};
  if (null != params[name] && params.hasOwnProperty(name)) return params[name];
  if (null != body[name]) return body[name];
  if (null != query[name]) return query[name];
  return defaultValue;
};