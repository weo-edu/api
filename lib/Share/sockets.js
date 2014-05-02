var access = require('lib/access');

var actions = exports;


// XXX if access levels change between subscribe and unsubscribe
// we are in trouble. maybe we should always leave all rooms

actions.subscribe = function(req, res, next) {
  var addresses = req.param('addresses');
  var user = req.me;

  console.log('subscribe', user);

  addresses = [].concat(addresses);
  _.each(addresses, function(addressId) {
    _.each(user.accessKeys(addressId), function(sha) {
      console.log('join', sha)
      req.socket.join(sha);
    });
  });
};

actions.unsubscribe = function(req, res, next) {
  var addresses = req.param('addresses');
  var user = req.me;

  addresses = [].concat(addresses);
  _.each(addresses, function(address) {
    _.each(user.accessShas(address), function(shas) {
      req.socket.leave(sha);
    });
  });
};