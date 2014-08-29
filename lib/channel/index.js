var channel = module.exports;

var _ = require('lodash');

channel.parse = function(channel) {
  var cs = channel.split('!');
  var type = cs[0];
  var path = cs[1];
  var ps = path.split('.');
  var id = ps[0];
  return {
    type: cs[0],
    id: ps[0],
    path: path
  };
};

channel.toIds = function(channels) {
  return _.map(channels, function(channel) {
    return channel.parse(channel).id;
  });
};