var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');
var async = require('async');
var db = chug.db;
var channel = db.get('channels');
var _ = require('lodash');

function populateSelfLink(obj, key, cb) {
  var self = obj;
  channel.findOne({channel: self[key].selfLink}, function(err, channel) {
    if (err) return cb(err);
    if (!channel)
      return cb(null, channel);
    var set = {};

    set[key] = channel.object;
    _.extend(self,set);
    cb(null, channel);
  });
}

function populateSelfLinks(obj, cb, first) {
  var tasks = [];
  _.each(obj, function(value, key) {
    if (_.isObject(value) || _.isArray(value)) {
      if (_.has(value, 'selfLink')) {
        tasks.push(function(cb) {
          populateSelfLink(obj, key, cb);
        });
      } else {
        tasks.push(function(cb) {
          populateSelfLinks(obj[key], cb);
        });
      }
    }
  });

  if (!tasks.length)
    return cb(null, obj);

  async.parallel(tasks, function(err) {
    if (err) return cb(err);
    cb(null, obj);
  });
}

exports.up = function(next){
  var count = 0;
  chug.src('shares', {})
    .pipe(es.map(function(share, cb) {
      var self = this;
      populateSelfLinks(share, function(err) {
        if (err) throw err;
        cb(null, share);
      }, true);

    }))
    .pipe(chug.dest('shares'))
    .on('end', next);
};

exports.down = function(next){
  next();
};