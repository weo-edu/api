var access = require('lib/access');

exports.broadcast = function(io, evt) {
  return function(share) {
    var sockets = io.set('sockets');
    // send to all address access pairs
    _.each(share.to.addresses, function(address) {
      _.each(access.keys(address), function(key) {
        sockets.to(key);
      });
    });
    sockets.send({verb: evt, data: share.toJSON()});
  }
}