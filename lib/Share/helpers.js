var helpers = module.exports = {};
var _ = require('lodash');

helpers.userAddressQuery = function(board, user) {
  return {
    to: {$elemMatch: {
      board: board, 
      allow: {$in: user.access(board)},
      deny: {$ne: user.userType}
    }}
  };
};


helpers.query = function(boards, user, channel) {
  return {
    'channel': channel || null,
    $or: _.map(boards, function(board) {
      return helpers.userAddressQuery(board, user);
    })
  };
};

