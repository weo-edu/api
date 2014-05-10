var helpers = module.exports = {};
var _ = require('lodash');

helpers.userAddressQuery = function(group, user) {
  return {
    to: {$elemMatch: {
      id: group, 
      allow: {$in: user.access(group)},
      deny: {$ne: user.userType}
    }}
  };
};


helpers.query = function(groups, user, channel) {
  return {
    'channel': channel || null,
    $or: _.map(groups, function(group) {
      return helpers.userAddressQuery(group, user);
    })
  };
};

