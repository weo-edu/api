exports.user = function(user, group) {
  var access = [
    {role: user.type, type: 'public'},
    {role: user.type, type: 'user', id: user.id}
  ];
  if (user.groups.indexOf(group) >= 0)
    access.push({role: user.type, type: 'group', id: group});
  return access;
};

exports.key = function(addressId, entry) {
  return addressId + entry.role + entry.type + entry.id;
};

exports.keys = function(address) {
  _.map(address.access, function(entry) {
    return exports.key(address.id, entry);
  })
};