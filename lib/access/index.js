var access = exports;

/**
 * Share access helpers
 *
 * Types: "public", "group", "user"
 * Roles: "teacher", "student"
 * Id: userId or groupId
 */

access.user = function(user, group) {
  var entries = [
    access.entry('public', user.type),
    access.entry('user', user.type, user.id)
  ];
  if (user.groups.indexOf(group) >= 0)
    entries.push(access.entry('group', user.type, group));
  return entries;
};

access.entry = function(type, role, id) {
  return type + ':' + role + ':' + (id || '');
};

access.decode = function(entry, key) {
  var split = entry.split(':');
  entry = {
    type: split[0],
    role: split[1],
    id: split[2]
  };
  return key ? entry[key] : entry;
};

access.full = function(addressId, entry) {
  return addressId + ':' + entry;
};

access.all = function(address) {
  return _.map(address.access, function(entry) {
    return access.full(address.id, entry);
  })
};