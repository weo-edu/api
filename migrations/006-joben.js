var chug = require('chug')(require('../lib/config/').mongo.url);
var _ = require('lodash');
var es = require('event-stream');

exports.up = function(next){
  chug.src('users', {})
    .pipe(es.through(function(doc) {
      if(doc.email === 'jb.whittenburg@gmail.com')
        doc.username = 'jobenw';
      if(doc.email === 'alexw@thewillows.org')
        doc.username = 'alexw';
      this.emit('data', doc);
    }))
    .pipe(chug.dest('users'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
