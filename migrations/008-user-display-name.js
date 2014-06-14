var chug = require('chug')(require('../lib/config').mongo.url);
var es = require('event-stream');

exports.up = function(next){
  chug.src('users', {})
    .pipe(es.through(function() {
      user.displayName = [(user.name.honorificPrefix === 'None' || !user.name.honorificPrefix)
        ? user.name.givenName
        : user.name.honorificPrefix,
        user.name.familyName
      ].filter(Boolean).join(' ');
      this.emit('data', user);
    }))
    .pipe(chug.dest('users'))
    .on('end', next);
};

exports.down = function(next){
  next();
};
