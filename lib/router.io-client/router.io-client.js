module.exports = function(socket) {
  socket.get = function (url, data, cb) {
    return this.request(url, 'get', data, cb);
  };

  socket.post = function (url, data, cb) {
    return this.request(url, 'post', data, cb);
  };

  socket.put = function (url, data, cb) {
    return this.request(url, 'put', data, cb);
  };

  socket.patch = function(url, data, cb) {
    return this.request(url, 'patch', data, cb);
  };

  socket['delete'] = function (url, data, cb) {
    return this.request(url, 'delete', data, cb);
  };

  socket.request = function (url, method, data, cb) {
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