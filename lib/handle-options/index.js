var qs = require('querystring');

function prepare(req) {
  if (! req._query) {
    req._query = req.url.indexOf('?') !== -1 ? qs.parse(parse(req.url).query) : {};
  }
}

module.exports = function(srv) {
  var listeners = srv.listeners('request').slice(0);
  srv.removeAllListeners('request');
  srv.on('request', function(req) {
    prepare(req);
    if(req.method === 'OPTIONS' && req.url.indexOf('/socket.io') === 0) {
      if(req._query)
        req._query.sid = null;
    }
  });

  listeners.forEach(function(fn) {
    srv.on('request', fn);
  });
};