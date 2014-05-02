var http = require('http');

function Res(req, cb) {
  this.req = req;
  this.cb = cb || function(){};
};

module.exports  = Res;

Res.prototype.status = function(code) {
  this.statusCode = code;
  return this;
}

Res.prototype.send = function(body) {
  if (arguments.length === 2) {
    if (typeof body != 'number' && typeof arguments[1] === 'number') {
      this.statusCode = arguments[1];
    } else {
      this.statusCode = body;
      body = arguments[1];
    }
  }

  if (typeof body === 'number') {
    this.statusCode = body;
    body = http.STATUS_CODES[body];
  }

  var headers = {
    status: this.statusCode,
    req: this.req,
    isError: this.statusCode >= 400
  };
  this.cb(headers, body);
};

