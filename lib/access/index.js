var access = exports;

/**
 * Share access helpers
 *
 * Types: "public", "group", "user"
 * Roles: "teacher", "student"
 * Id: userId or groupId
 */

access.entry = function(type, role, id) {
  return [type, role, id].filter(Boolean).join(':');
};

access.decode = function(entry) {
  var split = entry.split(':');
  return {
    type: split[0],
    role: split[1],
    id: split[2]
  };
};

access.encode = function(entry) {
  return access.entry(entry.type, entry.role, entry.id);
};