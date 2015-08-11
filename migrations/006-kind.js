var chug = require('mongo-chug')(require('../lib/config/').mongo);
var es = require('event-stream');
var qs = require('querystring');
var async = require('async');

exports.up = function(next){
  var map = {shares: 'Share', groups: 'Group', users: 'User'};

  async.each(Object.keys(map), function(collection, cb) {
    var kind = map[collection];
    console.log('kinds', collection)
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
