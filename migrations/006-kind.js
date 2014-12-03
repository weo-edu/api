var chug = require('chug')(require('../lib/config/').mongo.url);
var es = require('event-stream');
var qs = require('querystring');
var async = require('async');

exports.up = function(next){
  var map = {shares: 'Share', groups: 'Group', users: 'User', s3: 'S3'};

  async.each(Object.keys(map), function(collection, cb) {
    var kind = map[collection];
    chug.src(collection)
      .pipe(es.through(function(doc) {
        doc.kind = kind;
        this.emit('data', doc);
      }))
      .pipe(chug.dest(collection))
      .on('end', cb);
  }, next);
};

exports.down = function(next){
  next();
};
