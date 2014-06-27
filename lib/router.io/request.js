var _ = require('lodash');

function Req(data, socket) {
  _.extend(this, data);
  this.method = this.method.toUpperCase();
  this.socket = socket;
  this.sockets = socket.nsp;
}

module.exports = Req;

Req.prototype.param = function(name, defaultValue){
  var params = this.params || {};
  var body = this.body || {};
  var query = this.query || {};
  if (params[name] && params.hasOwnProperty(name)) return params[name];
  if (body[name]) return body[name];
  if (query[name]) return query[name];
  return defaultValue;
};