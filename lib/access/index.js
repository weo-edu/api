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
    access.entry('public', user.userType),
    access.entry('user', user.userType, user.id)
  ];
  if (user.groups.indexOf(group) >= 0)
    entries.push(access.entry('group', user.userType, group));
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

access.encode = function(entry) {
  return access.entry(entry.type, entry.role, entry.id);
}

access.full = function(board, entry, channel) {
  return board + (channel ? channel + ':' : '') + ':' + entry;
};

access.all = function(address, channel) {
  return address.allow.map(function(entry) {
    return access.full(address.board, entry, channel);
  });
};