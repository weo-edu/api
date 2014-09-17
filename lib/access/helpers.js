var access = exports;
var _ = require('lodash');

/**
 * Share access helpers
 *
 * Types: "public", "group", "user"
 * Id: userId or groupId
 */
access.entry = function(type, key) {
  key = _.clone(key || {}, true);
  key.id = access.encode(type, key.id);
  return key;
};

access.decode = function(entry) {
  var split = entry.split(':');
  return {
    type: split[0],
    id: split[1]
  };
};

access.encode = function(type, id) {
  return [type, id].filter(Boolean).join(':');
};

access.public = {
  id: 'public',
  displayName: 'Public',
  url: '/'
};