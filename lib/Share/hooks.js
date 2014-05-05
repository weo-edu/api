var access = require('lib/access');

exports.broadcast = function(io, evt) {
  return function(share) {
    var sockets = io.set('sockets');
    // send to all address access pairs
    _.each(share.to, function(address) {
      _.each(address.allow, function(entry) {
        if (address.deny && address.deny === access.decode(entry, 'role'))
          return;
        sockets.to(access.full(address.id, entry));
      });
    });
    sockets.send({verb: evt, data: share.toJSON()});
  }
}