var helpers = module.exports = {};

helpers.userAddressQuery = function(group, user) {
  var access = user.access(group);
  var accessQuery = _.map(access, function(entry) {
    return {access: {$elemMatch: entry}};
  });
  return {
    'to.addresses': {$elemMatch: {id: group, $or: accessQuery}}
  };
};


helpers.query = function(groups, user, scope) {
  return {
    'to.scope': scope || null,
    $or: _.map(groups, function(group) {
      return helpers.userAddressQuery(group, user);
    })
  };
}