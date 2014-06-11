var chug = require('chug')(require('../lib/config').mongo.url);
var _ = require('lodash');
var es = require('event-stream');
var ObjectId = require('mongoose/node_modules/mongodb').native().ObjectID;

exports.up = function(next){
  chug.src('users', {})
    .pipe(es.through(function(doc) {
      doc.groups = doc.groups && doc.groups.map(function(id) {
        return 'string' === typeof id
          ? ObjectId(id)
          : id;
      });
      this.emit('data', doc);
    }))
    .pipe(chug.dest('users'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
