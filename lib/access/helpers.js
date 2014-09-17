var access = exports;
var _ = require('lodash');

/**
 * Share access helpers
 *
 * Types: "public", "group", "user"
 * Id: userId or groupId
 */
access.entry = function(type, role, key) {
  key = _.clone(key || {}, true);
  key.id = access.encode(type, role, key.id);
  return key;
};

access.decode = function(entry) {
  var split = entry.split(':');
  return {
    type: split[0],
    role: split[1],
    id: split[2]
  };
};

access.encode = function(type, role, id) {
  return [type, role, id].filter(Boolean).join(':');
};

access.public = {
  id: 'public',
  displayName: 'Public',
  url: '/'
};