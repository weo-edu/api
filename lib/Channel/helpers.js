var helpers = module.exports;
var Seq = require('seq');
var _ = require('lodash');
var mongoose = require('mongoose');
var lock = require('redis-lock')(require('lib/redis').default);

helpers.parse = function(channel) {
  var parts = channel.split('.');
  var root = parts[0].split('!');
  return {
    channel: channel,
    root: {
      modelName: root[0][0].toUpperCase() + root[0].slice(1),
      id: root[1]
    },
    path: parts.slice(1).join('.'),
    leaf: parts.length > 2 && parts[parts.length - 2],
    property: parts[parts.length - 1]
  };
};

helpers.toIds = function(channels) {
  return _.map(channels, function(channel) {
    return helpers.parse(channel).root.id;
  });
};

helpers.withModel = function(channel, cb) {
  var descriptor = helpers.parse(channel);
  var root = descriptor.root;
  lock('channel:' + root.id, 2000, function(done) {
    mongoose.model(root.modelName)
      .findById(root.id)
      .exec(function(err, model) {
        descriptor.model = model;
        descriptor.done = done;
        cb(err, descriptor);
      });
  });
  
};


//not using anymore
/*helpers.models = function(channels, cb) {
  Seq(channels)
    .parMap(function(channel) {
      helpers.withModel(channel, this);
    })
    .seq(function() { cb(null, [].slice.call(arguments)); })
    .catch(cb);
};*/