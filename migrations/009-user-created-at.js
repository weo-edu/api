var chug = require('chug')(require('../lib/config').mongo.url);
var es = require('event-stream');

exports.up = function(next){
  chug.src('users', {})
    .pipe(es.through(function(user) {
      if (!user.createdAt) {
        user.createdAt = new Date;
      }
      this.emit('data', user);
    }))
    .pipe(chug.dest('users'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
