module.exports = function() {
  // var listeners = srv.listeners('request').slice(0);
  // srv.removeAllListeners('request');
  // srv.on('request', function(req, res) {
  //   if(req.method === 'OPTIONS' && req.url.indexOf('/socket.io') === 0) {
  //     var headers = {};
  //     if (req.headers.origin) {
  //       headers['Access-Control-Allow-Credentials'] = 'true';
  //       headers['Access-Control-Allow-Origin'] = req.headers.origin;
  //     } else {
  //       headers['Access-Control-Allow-Origin'] = '*';
  //     }

  //     headers['Access-Control-Allow-Headers'] = 'origin, content-type, accept';
  //     res.writeHead(200, headers);
  //     res.end();
  //   } else {
  //     listeners.forEach(function(fn) {
  //       fn.call(srv, req, res);
  //     });
  //   }
  // });
};