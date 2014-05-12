var helpers = module.exports = {};

helpers.userAddressQuery = function(group, user) {
  return {
    to: {$elemMatch: {
      id: group,
      allow: {$in: user.access(group)},
      deny: {$ne: user.type}
    }}
  };
};


helpers.query = function(groups, user, parent) {
  return {
    'parent.id': parent || null,
    $or: groups.map(function(group) {
      return helpers.userAddressQuery(group, user);
    })
  };
};

