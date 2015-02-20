module.exports = function(srv) {
  var listeners = srv.listeners('request').slice(0);
  srv.removeAllListeners('request');
  srv.on('request', function(req) {
    if(req.method === 'OPTIONS' && req.url.indexOf('/socket.io') === 0) {
      if(req._query)
        req._query.sid = null;
    }
  });

  listeners.forEach(function(fn) {
    srv.on('request', fn);
  });
};