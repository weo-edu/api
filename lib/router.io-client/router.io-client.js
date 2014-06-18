module.exports = function(socket) {
  socket.get = function (url, data, cb) {
    return this.request(url, data, 'get', cb);
  };

  socket.post = function (url, data, cb) {
    return this.request(url, data, 'post', cb);
  };

  socket.put = function (url, data, cb) {
    return this.request(url, data, 'put', cb);
  };

  socket.patch = function(url, data, cb) {
    return this.request(url, data, 'patch', cb);
  };

  socket['delete'] = function (url, data, cb) {
    return this.request(url, data, 'delete', cb);
  };

  socket.request = function (url, data, method, cb) {
    var socket = this;

    // If method is undefined, use 'get'
    method = method || 'get';


    // Allow data arg to be optional
    if ( typeof data === 'function' ) {
      cb = data;
      data = {};
    }

    // Build request
    var json = {
      url: url,
      body: data,
      method: method
    };

    // Send the message over the socket
    this.emit('route', json, function(headers, body) {
      if (cb) {
        cb(headers, body);
      } else if (headers.isError) {
        var err = new Error(body);
        err.status = headers.status;
        err.req = headers.req;
        throw err;
      }
    });
  };

  return socket;
};